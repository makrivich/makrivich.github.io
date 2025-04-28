// URL для основного расписания и расписания элективов
const MAIN_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lWqIJaWWXceiE_CWyIdzMRLcRoQa-ulnT5tJfgLDo0o/export?format=csv&gid=0';
const ELECTIVES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1qS4JSUM2DqFgZhmiMfaJ8VU-t2DvpRtJyadEQkdxujA/export?format=csv';

// Расписание звонков
const SCHEDULE_WEEKDAYS = {
    '0 урок': '7:45–8:25',
    '1 урок': '8:30–9:10',
    '2 урок': '9:20–10:00',
    '3 урок': '10:15–10:55',
    '4 урок': '11:15–11:55',
    '5 урок': '12:15–12:55',
    '6 урок': '13:05–13:45',
    '7 урок': '13:55–14:35',
    '8 урок': '14:45–15:20'
};

const SCHEDULE_SATURDAY = {
    '0 урок': '7:45–8:25',
    '1 урок': '8:30–9:10',
    '2 урок': '9:20–10:00',
    '3 урок': '10:15–10:55',
    '4 урок': '11:10–11:50',
    '5 урок': '12:05–12:45',
    '6 урок': '12:55–13:35',
    '7 урок': '13:45–14:25',
    '8 урок': '14:45–15:20'
};

// Определение цвета карточки в зависимости от предмета
function getSubjectColor(subject) {
    if (!subject || subject === 'Нет урока') return 'default-pastel';

    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('русский') || subjectLower.includes('английский')) {
        return 'red-pastel';
    } else if (
        subjectLower.includes('алгебра') ||
        subjectLower.includes('геометрия') ||
        subjectLower.includes('вис') ||
        subjectLower.includes('информатика') ||
        subjectLower.includes('физика') ||
        subjectLower.includes('огэ по математике')
    ) {
        return 'blue-pastel';
    } else if (
        subjectLower.includes('литература') ||
        subjectLower.includes('проектная деятельность')
    ) {
        return 'yellow-pastel';
    } else if (
        subjectLower.includes('история') ||
        subjectLower.includes('обществознание') ||
        subjectLower.includes('разговоры о важном') ||
        subjectLower.includes('классный час') ||
        subjectLower.includes('профориентация')
    ) {
        return 'orange-pastel';
    } else if (
        subjectLower.includes('химия') ||
        subjectLower.includes('биология') ||
        subjectLower.includes('география')
    ) {
        return 'green-pastel';
    } else if (
        subjectLower.includes('физкультура') ||
        subjectLower.includes('обзр')
    ) {
        return 'purple-pastel';
    }
    return 'default-pastel';
}

async function fetchSchedule(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные: ' + response.status);
        }
        const text = await response.text();
        console.log('Полученные данные (сырой CSV):', text);
        const data = parseCSV(text);
        console.log('Распарсенные данные:', data);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return null;
    }
}

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    return rows;
}

function getDayWithTimeShift() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const utcPlus5Time = new Date(utcTime + (5 * 60 * 60 * 1000));

    let dayIndex = utcPlus5Time.getDay();
    const hours = utcPlus5Time.getHours();
    const minutes = utcPlus5Time.getMinutes();
    console.log('Текущее время в UTC+5:', `${hours}:${minutes}`);

    if (dayIndex === 0) {
        return {
            displayDayIndex: 1,
            isSunday: true,
            date: utcPlus5Time
        };
    }

    const isAfter16 = (hours > 16) || (hours === 16 && minutes >= 0);
    if (isAfter16) {
        dayIndex = (dayIndex + 1) % 7;
        utcPlus5Time.setDate(utcPlus5Time.getDate() + 1);
    }

    return {
        displayDayIndex: dayIndex,
        isSunday: false,
        date: utcPlus5Time
    };
}

function displaySchedule(data, containerId, title) {
    const { displayDayIndex, isSunday, date } = getDayWithTimeShift();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const currentDay = days[displayDayIndex];
    
    console.log(`Отображаемый день для ${title}:`, currentDay);

    const headerRow = data[0] || [];
    console.log(`Заголовки таблицы (${title}):`, headerRow);
    const dayIndex = headerRow.indexOf(currentDay);

    if (dayIndex === -1) {
        console.log(`Дни в таблице (${title}):`, headerRow);
        document.getElementById(containerId).innerHTML = `<p class="error">Данные для текущего дня (${currentDay}) не найдены</p>`;
        return;
    }

    const scheduleTimes = displayDayIndex === 6 ? SCHEDULE_SATURDAY : SCHEDULE_WEEKDAYS;
    const currentTime = date.getHours() * 60 + date.getMinutes();

    let html = `<h2>${currentDay}</h2>`;
    if (isSunday) {
        html += `<p class="info">Сегодня воскресенье, показываем расписание на понедельник.</p>`;
    }

    let currentLessonInfo = 'Нет текущего урока';
    let foundCurrentLesson = false;

    for (let i = 1; i < data.length; i++) {
        const lessonWithTime = data[i][0] || '';
        const subject = data[i][dayIndex] || 'Нет урока';

        const match = lessonWithTime.match(/(.*)\s*\((.*)\)/);
        const lesson = match ? match[1].trim() : lessonWithTime;
        const time = scheduleTimes[lesson] || '-';

        let isCurrentLesson = false;
        if (!isSunday && time !== '-') {
            const [start, end] = time.split('–').map(t => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            });
            if (currentTime >= start && currentTime <= end) {
                isCurrentLesson = true;
                foundCurrentLesson = true;
            }
        }

        if (lesson) {
            const subjectParts = subject.split(' ');
            const roomNumber = subject === 'Нет урока' ? '' : subjectParts.pop();
            const subjectName = subject === 'Нет урока' ? 'Нет урока' : subjectParts.join(' ');

            const colorClass = getSubjectColor(subjectName);
            html += `
                <div class="lesson-card ${colorClass} ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${i - 1}">
                    ${lesson}<br>
                    ${subjectName}<br>
                    ${time}<br>
                    ${subject === 'Нет урока' ? '' : roomNumber + ' кабинет'}
                </div>
            `;

            if (isCurrentLesson && containerId === 'main-schedule') {
                currentLessonInfo = `${subjectName} (${time})`;
            }
        }
    }

    document.getElementById(containerId).innerHTML = html;

    if (containerId === 'main-schedule') {
        const currentLessonElement = document.getElementById('current-lesson');
        currentLessonElement.innerHTML = currentLessonInfo;
    }
}

// Функция для форматирования даты в формате гггг-мм-дд
function formatDateForMenu(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Функция для открытия меню
function openMenu() {
    const { date, isSunday } = getDayWithTimeShift();
    const menuDate = new Date(date);

    if (isSunday) {
        menuDate.setDate(menuDate.getDate() + 1);
    }

    const formattedDate = formatDateForMenu(menuDate);
    const encodedMenuUrl = encodeURIComponent(`https://aksioma.obrku.ru/food/${formattedDate}-sm.xlsx`);
    const finalUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedMenuUrl}&wdOrigin=BROWSELINK`;
    window.open(finalUrl, '_blank');
}

// Функция для открытия Task Manager с уведомлением
function openTaskManager() {
    const confirmed = confirm('Это бета-функция и может работать нестабильно. Продолжить?');
    if (confirmed) {
        window.open('https://makrivich.github.io/taskmanager/', '_blank');
    }
}

// Функция для отображения счетчика
function showCountdown() {
    const { date } = getDayWithTimeShift();
    const currentDate = new Date(date);

    const lastBellDate = new Date('2025-05-20T00:00:00');
    const utcTimeLastBell = lastBellDate.getTime() + (lastBellDate.getTimezoneOffset() * 60000);
    const lastBellDateUTC5 = new Date(utcTimeLastBell + (5 * 60 * 60 * 1000));

    currentDate.setHours(0, 0, 0, 0);
    lastBellDateUTC5.setHours(0, 0, 0, 0);

    const timeDifference = lastBellDateUTC5 - currentDate;
    const totalDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    const holidays = [
        new Date('2025-05-01T00:00:00'),
        new Date('2025-05-02T00:00:00'),
        new Date('2025-05-03T00:00:00'),
        new Date('2025-05-08T00:00:00'),
        new Date('2025-05-09T00:00:00'),
        new Date('2025-05-10T00:00:00')
    ].map(date => {
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        const dateUTC5 = new Date(utcTime + (5 * 60 * 60 * 1000));
        dateUTC5.setHours(0, 0, 0, 0);
        return dateUTC5.getTime();
    });

    let schoolDays = 0;
    const tempDate = new Date(currentDate);
    while (tempDate <= lastBellDateUTC5) {
        const tempDateTime = tempDate.getTime();
        const isHoliday = holidays.includes(tempDateTime);
        const isSunday = tempDate.getDay() === 0;

        if (!isHoliday && !isSunday) {
            schoolDays++;
        }

        tempDate.setDate(tempDate.getDate() + 1);
    }

    const daysDifference = totalDays;

    const countdownElement = document.getElementById('countdown-result');
    if (daysDifference > 0) {
        countdownElement.innerHTML = `До последнего звонка осталось ${totalDays} дней, из них ${schoolDays} учебных дней!`;
    } else if (daysDifference === 0) {
        countdownElement.innerHTML = `Сегодня последний звонок!`;
    } else {
        countdownElement.innerHTML = `Последний звонок уже прошел!`;
    }
}

// Уведомления о ближайших событиях
const events = [
    { date: '2025-05-01', name: 'День труда (выходной)' },
    { date: '2025-05-02', name: 'День труда (выходной)' },
    { date: '2025-05-03', name: 'День труда (выходной)' },
    { date: '2025-05-08', name: 'День Победы (выходной)' },
    { date: '2025-05-09', name: 'День Победы (выходной)' },
    { date: '2025-05-10', name: 'День Победы (выходной)' },
    { date: '2025-05-20', name: 'Последний звонок' }
];

function showUpcomingEvent() {
    const { date } = getDayWithTimeShift();
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);

    let nearestEvent = null;
    let daysToEvent = Infinity;

    events.forEach(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const timeDiff = eventDate - currentDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < daysToEvent) {
            daysToEvent = daysDiff;
            nearestEvent = event;
        }
    });

    const eventElement = document.getElementById('upcoming-event');
    if (nearestEvent && daysToEvent <= 7) {
        eventElement.innerHTML = `Ближайшее событие: ${nearestEvent.name} через ${daysToEvent} дней!`;
    } else {
        eventElement.innerHTML = '';
    }
}

// Отображение текущей даты и времени
function updateCurrentTime() {
    const { date } = getDayWithTimeShift();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    document.getElementById('current-time').innerHTML = `Сегодня: ${day}.${month}.${year}, ${hours}:${minutes} UTC+5`;
}

// Переключение темы
function toggleTheme() {
    const themeButton = document.getElementById('theme-button');
    const currentTheme = localStorage.getItem('theme') || 'system';

    if (currentTheme === 'dark') {
        document.body.classList.remove('dark-theme');
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'system');
        applySystemTheme();
        themeButton.innerHTML = '⚙️';
    } else if (currentTheme === 'system') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        themeButton.innerHTML = '☀️';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        themeButton.innerHTML = '🌙';
    }
}

// Применение системной темы
function applySystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.add('light-theme');
    }
}

async function loadSchedules() {
    const mainDataPromise = fetchSchedule(MAIN_SHEET_URL);
    const electivesDataPromise = fetchSchedule(ELECTIVES_SHEET_URL);

    const mainData = await mainDataPromise;
    if (mainData) {
        displaySchedule(mainData, 'main-schedule', 'Обычное расписание');
    } else {
        document.getElementById('main-schedule').innerHTML = `<p class="error">Не удалось загрузить обычное расписание</p>`;
    }

    const electivesData = await electivesDataPromise;
    if (electivesData) {
        displaySchedule(electivesData, 'electives-schedule', 'Расписание элективов');
    } else {
        document.getElementById('electives-schedule').innerHTML = `<p class="error">Не удалось загрузить расписание элективов</p>`;
    }

    showUpcomingEvent();
    updateCurrentTime();
}

// Инициализация темы
const savedTheme = localStorage.getItem('theme') || 'system';
const themeButton = document.getElementById('theme-button');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeButton.innerHTML = '🌙';
} else if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeButton.innerHTML = '☀️';
} else {
    applySystemTheme();
    themeButton.innerHTML = '⚙️';
    localStorage.setItem('theme', 'system');
}

// Слушаем изменения системной темы
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'system') {
        if (e.matches) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    }
});

loadSchedules();
setInterval(loadSchedules, 300000);
setInterval(updateCurrentTime, 60000);

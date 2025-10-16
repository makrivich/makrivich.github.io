// URL для расписания по дням недели
const SCHEDULE_URLS = {
    'Понедельник': 'https://docs.google.com/spreadsheets/d/1lHa4KM1pvTWCQpyvIAUUmJ8OlcNPh_LD/export?format=csv',
    'Вторник': 'https://docs.google.com/spreadsheets/d/1vd879IwGkXY2jyI4BuEStsIAMrTJN1w-/export?format=csv',
    'Среда': 'https://docs.google.com/spreadsheets/d/1vzx1c0pXxF9WANphsNdC9mPD-zR3Rq1e/export?format=csv',
    'Четверг': 'https://docs.google.com/spreadsheets/d/1UI5NLHSW5pfn0tR6IB9igRUDXLoWDTv9/export?format=csv',
    'Пятница': 'https://docs.google.com/spreadsheets/d/1Xlicp7IxQDNTXJcVvBqjJmiyuBcGJHe7/export?format=csv',
    'Суббота': 'https://docs.google.com/spreadsheets/d/16agkm-1YKvEOyBdwOBMbpXX_dQaIytmC/export?format=csv'
};

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

async function loadClasses() {
    const classSelect = document.getElementById('class-select');
    classSelect.innerHTML = '<option value="" disabled selected>Выберите класс</option>';

    const classes = new Set();

    for (const day in SCHEDULE_URLS) {
        const data = await fetchSchedule(SCHEDULE_URLS[day]);
        if (data && data[0]) {
            const headerRow = data[0];
            for (let i = 1; i < headerRow.length; i++) {
                if (headerRow[i]) {
                    classes.add(headerRow[i]);
                }
            }
        }
    }

    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
    });
}

async function loadSchedule() {
    const classSelect = document.getElementById('class-select');
    const daySelect = document.getElementById('day-select');
    const selectedClass = classSelect.value;
    const selectedDay = daySelect.value;
    const scheduleContainer = document.getElementById('schedule-container');

    if (!selectedClass || !selectedDay) {
        scheduleContainer.innerHTML = '<p class="info">Выберите класс и день недели</p>';
        return;
    }

    scheduleContainer.innerHTML = '<p class="loading">Подождите, расписание загружается...</p>';

    const data = await fetchSchedule(SCHEDULE_URLS[selectedDay]);
    if (!data) {
        scheduleContainer.innerHTML = '<p class="error">Не удалось загрузить расписание</p>';
        return;
    }

    const headerRow = data[0] || [];
    const classIndex = headerRow.indexOf(selectedClass);

    if (classIndex === -1) {
        scheduleContainer.innerHTML = `<p class="error">Класс ${selectedClass} не найден для ${selectedDay}</p>`;
        return;
    }

    const scheduleTimes = selectedDay === 'Суббота' ? SCHEDULE_SATURDAY : SCHEDULE_WEEKDAYS;
    const { date, isSunday } = getDayWithTimeShift();
    const currentTime = date.getHours() * 60 + date.getMinutes();
    const isCurrentDay = selectedDay === ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][getDayWithTimeShift().displayDayIndex];

    let html = `<h2>${selectedDay}, ${selectedClass}</h2>`;
    if (isSunday && selectedDay === 'Понедельник') {
        html += `<p class="info">Сегодня воскресенье, показываем расписание на понедельник.</p>`;
    }

    let foundCurrentLesson = false;

    for (let i = 1; i < data.length; i++) {
        const lessonWithTime = data[i][0] || '';
        const subject = data[i][classIndex] || 'Нет урока';

        const match = lessonWithTime.match(/(.*)\s*\((.*)\)/);
        const lesson = match ? match[1].trim() : lessonWithTime;
        const time = scheduleTimes[lesson] || '-';

        let isCurrentLesson = false;
        if (!isSunday && isCurrentDay && time !== '-') {
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
        }
    }

    scheduleContainer.innerHTML = html;
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

// Инициализация
async function init() {
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

    await loadClasses();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
}

init();
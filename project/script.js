// URL для расписания по дням недели
const SCHEDULE_URLS = {
    'Понедельник': 'https://docs.google.com/spreadsheets/d/1lHa4KM1pvTWCQpyvIAUUmJ8OlcNPh_LD/export?format=csv',
    'Вторник': 'https://docs.google.com/spreadsheets/d/1vd879IwGkXY2jyI4BuEStsIAMrTJN1w-/export?format=csv',
    'Среда': 'https://docs.google.com/spreadsheets/d/1vzx1c0pXxF9WANphsNdC9mPD-zR3Rq1e/export?format=csv',
    'Четверг': 'https://docs.google.com/spreadsheets/d/1UI5NLHSW5pfn0tR6IB9igRUDXLoWDTv9/export?format=csv',
    'Пятница': 'https://docs.google.com/spreadsheets/d/1Xlicp7IxQDNTXJcVvBqjJmiyuBcGJHe7/export?format=csv',
    'Суббота': 'https://docs.google.com/spreadsheets/d/16agkm-1YKvEOyBdwOBMbpXX_dQaIytmC/export?format=csv'
};

// URL для таблицы с ID/ФИО/инициалами/кабинетами
const TEACHER_CABINET_URL = 'https://docs.google.com/spreadsheets/d/1UvKBhlXNfwll1DnY5wwxitAvzb-Fq4X1QbVCBAg0Wmw/export?format=csv';

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

// Словарь для полных названий предметов
const SUBJECT_FULL_NAMES = {
    'матем': 'Математика',
    'рус яз': 'Русский язык',
    'англ яз': 'Английский язык',
    'инфор': 'Информатика',
    'ИЗО': 'Изобразительное искусство',
    'литер': 'Литература',
    'геогр': 'География',
    'проф': 'Профориентация',
    'биол': 'Биология',
    'физика': 'Физика',
    'физ Т': 'Физика',
    'физ С': 'Физика',
    'геом': 'Геометрия',
    'алгеб': 'Алгебра',
    'ВиС': 'Вероятность и Статистика',
    'общ': 'Обществознание',
    'общ С': 'Обществознание',
    'общ Т': 'Обществознание',
    'ОБЗР': 'Основы безопасности и Защиты Родины',
    'труд': 'Труд',
    'музыка': 'Музыка',
    'истор': 'История',
    'рус яз эл': 'Русский язык электив',
    'общ эл': 'Обществознание elekтив',
    'инфор эл': 'Информатика elekтив',
    'зан рус': 'Занимательный русский язык',
    'функ гр': 'Функциональная грамотность',
    'физ-ра': 'Физическая культура',
    'физра': 'Физическая культура'
};

// Функция для парсинга строки урока на части
function getLessonParts(subject) {
    if (subject === 'Нет урока') return [];
    const rawParts = subject.split(/\/|\n/).map(part => part.trim()).filter(part => part);
    const lessons = [];
    let current = null;
    for (let raw of rawParts) {
        if (raw === '---') {
            if (current) {
                current.onlyCertainRooms = true;
            } else {
                lessons.push({subjectName: 'Урок отменен', initials: '', rooms: [], comment: [], onlyCertainRooms: false});
            }
            continue;
        }
        const parts = raw.split(/\s+/);
        let room = parts.pop();
        let hasRoom = /^\d+[а-яА-Я]?$/i.test(room);
        if (!hasRoom) {
            parts.push(room);
            room = null;
        }
        let subjectStr = parts.join(' ');
        let initials = '';
        const match = subjectStr.match(/(.*)\s*\((.*?)\)$/);
        if (match) {
            subjectStr = match[1].trim();
            initials = match[2].trim();
        }
        let fullSubject = subjectStr;
        let matched = false;
        let usedKey = '';
        const keys = Object.keys(SUBJECT_FULL_NAMES).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            if (subjectStr.toLowerCase().includes(key.toLowerCase())) {
                fullSubject = SUBJECT_FULL_NAMES[key];
                matched = true;
                usedKey = key;
                break;
            }
        }
        let extra = '';
        if (matched) {
            extra = subjectStr.toLowerCase().replace(usedKey.toLowerCase(), '').trim();
        }
        if (!matched && subjectStr) {
            console.warn(`Сокращение не найдено для предмета: ${subjectStr}`);
        }
        if (subjectStr && matched) { // Новый урок
            if (current) {
                lessons.push(current);
            }
            current = {
                subjectName: fullSubject,
                initials: initials,
                rooms: room ? [room] : [],
                comment: [],
                onlyCertainRooms: false
            };
            if (extra) {
                if (/^\d+[а-яА-Я]?$/i.test(extra) || ['акт зал', 'зал', 'библ'].includes(extra.toLowerCase())) {
                    current.rooms.push(extra);
                } else {
                    current.comment.push(extra);
                }
            }
        } else if (current) {
            if (subjectStr) {
                current.comment.push(subjectStr);
            } else if (room) {
                current.rooms.push(room);
            } else {
                current.comment.push(raw);
            }
        } else {
            current = {
                subjectName: fullSubject || subjectStr,
                initials: initials,
                rooms: room ? [room] : [],
                comment: [],
                onlyCertainRooms: false
            };
        }
    }
    if (current) {
        lessons.push(current);
    }
    return lessons;
}

async function fetchSchedule(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные: ' + response.status);
        }
        const text = await response.text();
        console.log('Raw CSV:', text);
        const data = parseCSV(text);
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

async function fetchTeacherCabinetData() {
    const data = await fetchSchedule(TEACHER_CABINET_URL);
    if (!data) return null;
    const teacherCabinetMap = {};
    for (let i = 1; i < data.length; i++) {
        const [id, , initials, cabinetStr] = data[i];
        const cabinets = cabinetStr ? cabinetStr.split(',').map(c => c.trim().toLowerCase()) : [];
        if (id && (initials || cabinets.length > 0)) {
            teacherCabinetMap[id] = { initials, cabinets };
        }
    }
    return teacherCabinetMap;
}

function getDayWithTimeShift() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const utcPlus5Time = new Date(utcTime + (5 * 60 * 60 * 1000));

    let dayIndex = utcPlus5Time.getDay();
    const hours = utcPlus5Time.getHours();
    const minutes = utcPlus5Time.getMinutes();

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
    const modeSelect = document.getElementById('mode-select');
    const classSelect = document.getElementById('class-select');
    const idInput = document.getElementById('id-input');
    const daySelect = document.getElementById('day-select');
    const scheduleContainer = document.getElementById('schedule-container');

    const mode = modeSelect.value;
    const selectedClass = classSelect.value;
    const selectedId = idInput.value.trim();
    const selectedDay = daySelect.value;

    if ((mode === 'class' && !selectedClass) || (mode === 'id' && !selectedId) || !selectedDay) {
        scheduleContainer.innerHTML = '<p class="info">Выберите режим, класс/ID и день недели</p>';
        return;
    }

    scheduleContainer.innerHTML = '<p class="loading">Подождите, расписание загружается...</p>';

    const data = await fetchSchedule(SCHEDULE_URLS[selectedDay]);
    if (!data) {
        scheduleContainer.innerHTML = '<p class="error">Не удалось загрузить расписание</p>';
        return;
    }

    const headerRow = data[0] || [];

    const scheduleTimes = selectedDay === 'Суббота' ? SCHEDULE_SATURDAY : SCHEDULE_WEEKDAYS;
    const { date, isSunday } = getDayWithTimeShift();
    const currentTime = date.getHours() * 60 + date.getMinutes();
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const isCurrentDay = selectedDay === dayNames[getDayWithTimeShift().displayDayIndex];

    let html = `<h2>${selectedDay}, ${mode === 'class' ? selectedClass : `ID ${selectedId}`}</h2>`;
    if (isSunday && selectedDay === 'Понедельник') {
        html += `<p class="info">Сегодня воскресенье, показываем расписание на понедельник.</p>`;
    }

    let indexCounter = 0;

    if (mode === 'class') {
        const classIndex = headerRow.indexOf(selectedClass);

        if (classIndex === -1) {
            scheduleContainer.innerHTML = `<p class="error">Класс ${selectedClass} не найден для ${selectedDay}</p>`;
            return;
        }

        for (let i = 1; i < data.length; i++) {
            const lessonWithTime = data[i][0] || '';
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
                }
            }

            const subject = data[i][classIndex] || 'Нет урока';
            const lessons = getLessonParts(subject);

            if (lessons.length === 0) {
                html += `
                    <div class="lesson-card no-lesson ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                        ${lesson}<br>
                        Нет урока<br>
                        ${time}
                    </div>
                `;
                indexCounter++;
            } else {
                lessons.forEach((les, k) => {
                    let displayName = les.subjectName;
                    if (les.comment.length > 0) {
                        displayName += ' ' + les.comment.join(' ');
                        les.comment = []; // Clear comment since it's now part of subjectName
                    }
                    displayName += (les.initials ? ` (${les.initials})` : '');
                    const commentHtml = ''; // No separate comment now
                    const prefix = les.onlyCertainRooms ? 'только ' : '';
                    les.rooms.forEach((room, m) => {
                        const baseDisplayRoom = /^\d+$/.test(room) ? room + ' кабинет' : room;
                        const displayRoom = prefix + baseDisplayRoom;
                        html += `
                            <div class="lesson-card ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                                ${lesson}<br>
                                ${displayName}<br>
                                ${time}<br>
                                ${displayRoom}${commentHtml}
                            </div>
                        `;
                        indexCounter += 0.1; // Для анимации
                    });
                    if (les.rooms.length === 0) {
                        html += `
                            <div class="lesson-card ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                                ${lesson}<br>
                                ${displayName}<br>
                                ${time}${commentHtml}
                            </div>
                        `;
                        indexCounter += 0.1;
                    }
                });
            }
        }

    } else { // mode 'id'
        const teacherCabinetData = await fetchTeacherCabinetData();
        if (!teacherCabinetData || !teacherCabinetData[selectedId]) {
            scheduleContainer.innerHTML = `<p class="error">ID ${selectedId} не найден</p>`;
            return;
        }

        const { initials, cabinets } = teacherCabinetData[selectedId];
        let foundLessons = false;

        for (let i = 1; i < data.length; i++) {
            const lessonWithTime = data[i][0] || '';
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
                }
            }

            if (!lesson) continue;

            for (let j = 1; j < headerRow.length; j++) {
                const cell = data[i][j] || 'Нет урока';
                if (cell === 'Нет урока') continue;

                const lessons = getLessonParts(cell);
                lessons.forEach(les => {
                    let displayName = les.subjectName;
                    if (les.comment.length > 0) {
                        displayName += ' ' + les.comment.join(' ');
                        les.comment = [];
                    }
                    displayName += (les.initials ? ` (${les.initials})` : '');
                    const commentHtml = '';
                    const prefix = les.onlyCertainRooms ? 'только ' : '';
                    const isInitialsMatch = initials && les.initials === initials;
                    const matchingRooms = les.rooms.filter(room => cabinets.includes(room.toLowerCase()));
                    if (isInitialsMatch && (matchingRooms.length > 0 || les.rooms.length === 0)) {
                        foundLessons = true;
                        if (matchingRooms.length > 0) {
                            matchingRooms.forEach(room => {
                                const baseDisplayRoom = /^\d+$/.test(room) ? room + ' кабинет' : room;
                                const displayRoom = prefix + baseDisplayRoom;
                                html += `
                                    <div class="lesson-card ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                                        ${lesson}<br>
                                        ${displayName}<br>
                                        ${time}<br>
                                        ${headerRow[j]}<br>
                                        ${displayRoom}${commentHtml}
                                    </div>
                                `;
                                indexCounter += 0.1;
                            });
                        } else {
                            html += `
                                <div class="lesson-card ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                                    ${lesson}<br>
                                    ${displayName}<br>
                                    ${time}<br>
                                    ${headerRow[j]}${commentHtml}
                                </div>
                            `;
                            indexCounter += 0.1;
                        }
                    } else if (!isInitialsMatch && matchingRooms.length > 0) {
                        foundLessons = true;
                        matchingRooms.forEach(room => {
                            const baseDisplayRoom = /^\d+$/.test(room) ? room + ' кабинет' : room;
                            const displayRoom = prefix + baseDisplayRoom;
                            html += `
                                <div class="lesson-card ${isCurrentLesson ? 'current-lesson' : ''}" style="--index: ${indexCounter}">
                                    ${lesson}<br>
                                    ${displayName}<br>
                                    ${time}<br>
                                    ${headerRow[j]}<br>
                                    ${displayRoom}${commentHtml}
                                </div>
                            `;
                            indexCounter += 0.1;
                        });
                    }
                });
            }
        }

        if (!foundLessons) {
            html += `<p class="info">Нет уроков для ID ${selectedId} в ${selectedDay}</p>`;
        }
    }

    scheduleContainer.innerHTML = html;
}

function toggleMode() {
    const modeSelect = document.getElementById('mode-select');
    const classSelection = document.getElementById('class-selection');
    const idSelection = document.getElementById('id-selection');

    if (modeSelect.value === 'class') {
        classSelection.style.display = 'block';
        idSelection.style.display = 'none';
    } else {
        classSelection.style.display = 'none';
        idSelection.style.display = 'block';
    }
    loadSchedule();
}

function formatDateForMenu(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

function updateCurrentTime() {
    const { date } = getDayWithTimeShift();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    document.getElementById('current-time').innerHTML = `Сегодня: ${day}.${month}.${year}, ${hours}:${minutes} UTC+5`;
}

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

function applySystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.add('light-theme');
    }
}

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

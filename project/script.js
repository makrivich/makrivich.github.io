let teachers = [];

const replacements = {
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
    'рус яз эл': 'Русский язык elekтив',
    'общ эл': 'Обществознание elekтив',
    'инфор эл': 'Информатика elekтив',
    'зан рус': 'Занимательный русский язык',
    // Добавим дополнительные сокращения, если есть
    'физ-ра': 'Физическая культура',
    'хим': 'Химия',
    'окр мир': 'Окружающий мир'
};

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const SCHEDULE_URLS = {
    'Понедельник': 'https://docs.google.com/spreadsheets/d/1lHa4KM1pvTWCQpyvIAUUmJ8OlcNPh_LD/export?format=csv',
    'Вторник': 'https://docs.google.com/spreadsheets/d/1vd879IwGkXY2jyI4BuEStsIAMrTJN1w-/export?format=csv',
    'Среда': 'https://docs.google.com/spreadsheets/d/1vzx1c0pXxF9WANphsNdC9mPD-zR3Rq1e/export?format=csv',
    'Четверг': 'https://docs.google.com/spreadsheets/d/1UI5NLHSW5pfn0tR6IB9igRUDXLoWDTv9/export?format=csv',
    'Пятница': 'https://docs.google.com/spreadsheets/d/1Xlicp7IxQDNTXJcVvBqjJmiyuBcGJHe7/export?format=csv',
    'Суббота': 'https://docs.google.com/spreadsheets/d/16agkm-1YKvEOyBdwOBMbpXX_dQaIytmC/export?format=csv'
};

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

let currentMode = 'class';

async function fetchSchedule(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Не удалось загрузить данные: ' + response.status);
        const text = await response.text();
        return parseCSV(text);
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
        if (char === '"') insideQuotes = !insideQuotes;
        else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else currentCell += char;
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    return rows;
}

async function loadTeachersFromFile() {
    try {
        const response = await fetch('https://makrivich.github.io/project/id_codes.txt');
        if (!response.ok) throw new Error('Не удалось загрузить id_codes.txt: ' + response.status);
        const text = await response.text();
        teachers = text.trim().split('\n').map(line => {
            const [id, ...rest] = line.split(/\s+/);
            const full = rest.slice(0, -2).join(' ');
            const initials = rest[rest.length - 2];
            const cabinet = rest[rest.length - 1];
            return { id, full, initials, cabinet };
        });
    } catch (error) {
        console.error('Ошибка загрузки учителей:', error);
        teachers = [];
    }
}

function switchTab(mode) {
    document.getElementById('class-tab').classList.remove('active');
    document.getElementById('teacher-tab').classList.remove('active');
    document.getElementById(mode + '-tab').classList.add('active');
    document.getElementById('class-mode').style.display = mode === 'class' ? 'block' : 'none';
    document.getElementById('teacher-mode').style.display = mode === 'teacher' ? 'block' : 'none';
    document.getElementById('schedule-container').innerHTML = '';
    currentMode = mode;
}

async function loadClasses() {
    const classSelect = document.getElementById('class-select');
    classSelect.innerHTML = '<option value="" disabled selected>Выберите класс</option>';

    const classes = new Set();
    for (const day of days) {
        const data = await fetchSchedule(SCHEDULE_URLS[day]);
        if (data && data[0]) {
            const headerRow = data[0];
            for (let i = 2; i < headerRow.length; i++) if (headerRow[i]) classes.add(headerRow[i]);
        }
    }
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
    });
}

function loadTeachers() {
    // Не требуется, так как ID вводится вручную
}

function loadDays(mode) {
    const daySelect = document.getElementById('day-select-' + mode);
    daySelect.innerHTML = '<option value="" disabled selected>Выберите день</option>';
    days.forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    });
}

async function loadSchedule(mode) {
    const scheduleContainer = document.getElementById('schedule-container');
    scheduleContainer.innerHTML = '<p class="loading">Подождите, расписание загружается...</p>';

    let selectedDay, selectedValue;
    if (mode === 'class') {
        selectedDay = document.getElementById('day-select-class').value;
        selectedValue = document.getElementById('class-select').value;
    } else {
        selectedDay = document.getElementById('day-select-teacher').value;
        selectedValue = document.getElementById('teacher-id-input').value;
    }
    if (!selectedDay || !selectedValue) {
        scheduleContainer.innerHTML = '<p class="info">Выберите день и значение</p>';
        return;
    }

    const data = await fetchSchedule(SCHEDULE_URLS[selectedDay]);
    if (!data) {
        scheduleContainer.innerHTML = '<p class="error">Не удалось загрузить расписание</p>';
        return;
    }

    const headerRow = data[0] || [];
    let html = `<h2>${selectedDay}</h2>`;

    if (mode === 'class') {
        const classIndex = headerRow.indexOf(selectedValue);
        if (classIndex === -1) {
            scheduleContainer.innerHTML = '<p class="error">Класс не найден</p>';
            return;
        }
        html = '';
        for (let i = 1; i < data.length; i++) {
            const lesson = data[i][0] || '';
            const subject = data[i][classIndex] || 'Нет урока';
            const fullSubject = replaceShortened(subject);
            const cabinet = extractCabinet(subject);
            const time = (selectedDay === 'Суббота' ? SCHEDULE_SATURDAY : SCHEDULE_WEEKDAYS)[lesson] || '-';
            html += `<div class="lesson-card">${lesson} (${time}): ${fullSubject} - Кабинет ${cabinet}</div>`;
        }
    } else {
        const teacher = teachers.find(t => t.id === selectedValue);
        if (!teacher) {
            scheduleContainer.innerHTML = '<p class="error">Учитель с ID ${selectedValue} не найден</p>';
            return;
        }
        const initials = teacher.initials;
        const defaultCabinet = teacher.cabinet;
        html = '';
        for (let i = 1; i < data.length; i++) {
            const lesson = data[i][0] || '';
            for (let j = 2; j < data[i].length; j++) {
                const subject = data[i][j] || '';
                if (subject.includes(initials) || checkSubstitution(subject, initials)) {
                    const className = headerRow[j];
                    const fullSubject = replaceShortened(subject);
                    let cabinet = extractCabinet(subject) || defaultCabinet;
                    const substitution = checkSubstitution(subject, initials) ? ` (зам. ${extractInitials(subject)})` : '';
                    const time = (selectedDay === 'Суббота' ? SCHEDULE_SATURDAY : SCHEDULE_WEEKDAYS)[lesson] || '-';
                    html += `<div class="lesson-card">${lesson} (${time}): ${fullSubject}${substitution} - Кабинет ${cabinet} (Класс ${className})</div>`;
                }
            }
        }
        if (html === '') html = '<p class="info">Нет уроков для этого учителя</p>';
    }
    scheduleContainer.innerHTML = html;
}

function replaceShortened(subject) {
    let parts = subject.split(' ');
    for (let k = 0; k < parts.length; k++) {
        const key = parts[k].toLowerCase();
        if (replacements[key]) parts[k] = replacements[key];
        else if (!parts[k].match(/\d+/)) parts[k] = parts[k]; // Сохраняем неизменными, если не число
    }
    return parts.join(' ');
}

function extractCabinet(subject) {
    const parts = subject.split(' ');
    const last = parts[parts.length - 1];
    return last.match(/\d+/) ? last : '';
}

function extractInitials(subject) {
    const match = subject.match(/[A-Z]{2,}/);
    return match ? match[0] : '';
}

function checkSubstitution(subject, initials) {
    const parts = subject.split(' ');
    for (let part of parts) {
        if (part !== initials && teachers.some(t => t.initials === part)) {
            return true;
        }
    }
    return false;
}

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    document.getElementById('current-time').innerHTML = `Сегодня: ${day}.${month}.${year}, ${hours}:${minutes} UTC+2`;
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

function openMenu() {
    const now = new Date();
    const menuDate = new Date(now);
    if (now.getDay() === 0) menuDate.setDate(menuDate.getDate() + 1);
    const formattedDate = `${menuDate.getFullYear()}-${String(menuDate.getMonth() + 1).padStart(2, '0')}-${String(menuDate.getDate()).padStart(2, '0')}`;
    const encodedMenuUrl = encodeURIComponent(`https://aksioma.obrku.ru/food/${formattedDate}-sm.xlsx`);
    const finalUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedMenuUrl}&wdOrigin=BROWSELINK`;
    window.open(finalUrl, '_blank');
}

async function init() {
    await loadTeachersFromFile();
    loadDays('class');
    loadDays('teacher');
    await loadClasses();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);

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
}

init();

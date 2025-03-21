const quizData = [
    {
        question: "На какой высоте начинается космос (линия Кармана)?",
        type: "radio",
        options: ["50 км", "100 км", "200 км"],
        correct: "100 км"
    },
    {
        question: "Как называется наша галактика?",
        type: "text",
        correct: "Млечный Путь"
    },
    {
        question: "Какие планеты находятся ближе всего и дальше всего от Солнца?",
        type: "checkbox",
        options: ["Меркурий", "Нептун", "Земля", "Уран"],
        correct: ["Меркурий", "Нептун"]
    },
    {
        question: "Сколько планет в Солнечной системе?",
        type: "number",
        correct: "8"
    },
    {
        question: "Когда был запущен первый искусственный спутник Земли 'Спутник-1'?",
        type: "date",
        correct: "04.10.1957"
    },
    {
        question: "Кто стал первым человеком в космосе?",
        type: "radio",
        options: ["Нил Армстронг", "Юрий Гагарин", "Алан Шепард"],
        correct: "Юрий Гагарин"
    },
    {
        question: "Сколько минут длился полет Юрия Гагарина?",
        type: "number",
        correct: "108"
    },
    {
        question: "Что такое пояс астероидов?",
        type: "radio",
        options: [
            "Область между Марсом и Юпитером с множеством астероидов",
            "Звезда в центре Солнечной системы",
            "Область с сильной гравитацией"
        ],
        correct: "Область между Марсом и Юпитером с множеством астероидов"
    },
    {
        question: "Соотнесите объекты с их описаниями",
        type: "match",
        pairs: [
            { object: "Черная дыра", description: "Область с сильной гравитацией в центре Млечного Пути" },
            { object: "Экзопланета", description: "Планета за пределами Солнечной системы" },
            { object: "Пояс астероидов", description: "Область между Марсом и Юпитером" }
        ],
        correct: [
            "Черная дыра - Область с сильной гравитацией в центре Млечного Пути",
            "Экзопланета - Планета за пределами Солнечной системы",
            "Пояс астероидов - Область между Марсом и Юпитером"
        ]
    },
    {
        question: "Какие утверждения верны про экзопланеты?",
        type: "checkbox",
        options: [
            "Их начали открывать в 1990-х годах",
            "Они находятся в Солнечной системе",
            "Обнаружено более 5000 экзопланет"
        ],
        correct: ["Их начали открывать в 1990-х годах", "Обнаружено более 5000 экзопланет"]
    }
];

const quizContainer = document.getElementById('quiz');
const resultContainer = document.getElementById('result');
const prevButton = document.getElementById('prev');
const checkButton = document.getElementById('check');
const nextButton = document.getElementById('next');
let currentQuestion = 0;
let answers = {};

// Создание викторины
function buildQuiz() {
    const output = [];
    quizData.forEach((item, index) => {
        let content = '';
        if (item.type === "radio") {
            content = item.options.map(option => `
                <label class="match-option">
                    <input type="radio" name="question${index}" value="${option}">
                    ${option}
                </label>
            `).join('');
        } else if (item.type === "text") {
            content = `
                <input type="text" id="text-answer${index}" placeholder="Введите ответ">
            `;
        } else if (item.type === "checkbox") {
            content = item.options.map(option => `
                <label>
                    <input type="checkbox" name="question${index}" value="${option}">
                    ${option}
                </label><br>
            `).join('');
        } else if (item.type === "number") {
            content = `
                <input type="number" id="number-answer${index}" placeholder="Введите число">
            `;
        } else if (item.type === "date") {
            content = `
                <input type="text" id="date-answer${index}" placeholder="Введите дату (например, 04.10.1957)">
            `;
        } else if (item.type === "match") {
            content = item.pairs.map(pair => `
                <div class="match-pair">
                    <p>${pair.object}</p>
                    <select name="match${index}-${pair.object}">
                        ${item.pairs.map(p => `
                            <option value="${p.object} - ${p.description}">${p.description}</option>
                        `).join('')}
                    </select>
                </div>
            `).join('');
        }
        output.push(`
            <div class="question ${index === 0 ? 'active' : ''}" data-number="${index}">
                <p>${index + 1}. ${item.question}</p>
                <div class="options">${content}</div>
                <div class="feedback" id="feedback${index}"></div>
            </div>
        `);
    });
    quizContainer.innerHTML = output.join('');
}

// Показать вопрос
function showQuestion(index) {
    const questions = document.querySelectorAll('.question');
    questions[currentQuestion].classList.remove('active');
    questions[index].classList.add('active');
    currentQuestion = index;

    prevButton.style.display = currentQuestion === 0 ? 'none' : 'inline';
    checkButton.style.display = answers[currentQuestion] ? 'none' : 'inline';
    nextButton.style.display = answers[currentQuestion] && currentQuestion < quizData.length - 1 ? 'inline' : 'none';

    updateFeedback();
}

// Обновить обратную связь
function updateFeedback() {
    const currentQ = document.querySelector(`.question[data-number="${currentQuestion}"]`);
    const feedback = currentQ.querySelector('.feedback');
    if (answers[currentQuestion]) {
        const selected = answers[currentQuestion];
        const correct = quizData[currentQuestion].correct;
        let isCorrect = false;

        if (quizData[currentQuestion].type === "radio" || quizData[currentQuestion].type === "text" || 
            quizData[currentQuestion].type === "number") {
            isCorrect = selected === correct;
        } else if (quizData[currentQuestion].type === "date") {
            const normalizedSelected = selected.replace(/\s/g, '').toLowerCase();
            const normalizedCorrect = correct.replace(/\s/g, '').toLowerCase();
            isCorrect = normalizedSelected === normalizedCorrect;
        } else if (quizData[currentQuestion].type === "checkbox") {
            isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(correct.sort());
        } else if (quizData[currentQuestion].type === "match") {
            isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(correct.sort());
        }

        feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
        feedback.innerHTML = isCorrect 
            ? 'Правильно!' 
            : `Неправильно. Правильный ответ: ${Array.isArray(correct) ? correct.join(', ') : correct}`;
    } else {
        feedback.className = 'feedback';
        feedback.innerHTML = '';
    }
}

// Проверка ответа
function checkAnswer() {
    const currentQ = document.querySelector(`.question[data-number="${currentQuestion}"]`);
    let selected;

    if (quizData[currentQuestion].type === "radio") {
        selected = currentQ.querySelector(`input[name=question${currentQuestion}]:checked`);
        if (!selected) {
            alert('Пожалуйста, выберите ответ!');
            return;
        }
        answers[currentQuestion] = selected.value;
    } else if (quizData[currentQuestion].type === "text") {
        selected = currentQ.querySelector(`#text-answer${currentQuestion}`).value.trim();
        if (!selected) {
            alert('Пожалуйста, введите ответ!');
            return;
        }
        answers[currentQuestion] = selected;
    } else if (quizData[currentQuestion].type === "checkbox") {
        selected = Array.from(currentQ.querySelectorAll(`input[name=question${currentQuestion}]:checked`))
            .map(input => input.value);
        if (selected.length === 0) {
            alert('Пожалуйста, выберите хотя бы один вариант!');
            return;
        }
        answers[currentQuestion] = selected;
    } else if (quizData[currentQuestion].type === "number") {
        selected = currentQ.querySelector(`#number-answer${currentQuestion}`).value.trim();
        if (!selected) {
            alert('Пожалуйста, введите число!');
            return;
        }
        answers[currentQuestion] = selected;
    } else if (quizData[currentQuestion].type === "date") {
        selected = currentQ.querySelector(`#date-answer${currentQuestion}`).value.trim();
        if (!selected) {
            alert('Пожалуйста, введите дату!');
            return;
        }
        answers[currentQuestion] = selected;
    } else if (quizData[currentQuestion].type === "match") {
        selected = [];
        quizData[currentQuestion].pairs.forEach(pair => {
            const select = currentQ.querySelector(`select[name="match${currentQuestion}-${pair.object}"]`);
            if (!select.value) {
                alert('Пожалуйста, выберите соответствие для всех объектов!');
                return;
            }
            selected.push(select.value);
        });
        if (selected.length !== quizData[currentQuestion].pairs.length) return;
        answers[currentQuestion] = selected;
    }

    updateFeedback();

    checkButton.style.display = 'none';
    if (currentQuestion < quizData.length - 1) {
        nextButton.style.display = 'inline';
    } else {
        setTimeout(showResults, 1000);
    }
}

// Генерация 6-значного кода с баллами
function generateCode(score) {
    const formattedScore = score < 10 ? `0${score}` : `${score}`; // Форматирование баллов: 5 → 05, 10 → 10
    return `${Math.floor(100000 + Math.random() * 900000)}${formattedScore}`;
}

// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Код скопирован в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка при копировании: ', err);
        alert('Не удалось скопировать код. Пожалуйста, скопируйте его вручную.');
    });
}

// Показать результаты
function showResults() {
    let score = 0;
    quizData.forEach((question, index) => {
        if (question.type === "radio" || question.type === "text" || question.type === "number") {
            if (answers[index] === question.correct) score++;
        } else if (question.type === "date") {
            const normalizedAnswer = answers[index]?.replace(/\s/g, '').toLowerCase();
            const normalizedCorrect = question.correct.replace(/\s/g, '').toLowerCase();
            if (normalizedAnswer === normalizedCorrect) score++;
        } else if (question.type === "checkbox" || question.type === "match") {
            if (JSON.stringify(answers[index]?.sort()) === JSON.stringify(question.correct.sort())) score++;
        }
    });

    const uniqueCode = generateCode(score);

    quizContainer.style.display = 'none';
    prevButton.style.display = 'none';
    checkButton.style.display = 'none';
    nextButton.style.display = 'none';
    resultContainer.style.display = 'block';

    resultContainer.innerHTML = `
        Викторина завершена! Вы набрали ${score} из ${quizData.length} баллов! Для того, чтобы отметиться о прохождении викторины заполните форму.
        <br><br>
        Ваш уникальный код: <strong id="unique-code">${uniqueCode}</strong>
        <button id="copy-code-btn" style="margin-left: 10px;">Скопировать код</button>
        <br><br>
        <div id="yandex-form-container">
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSc46otjgrk50k1CsN0_IX1nXHKPcuPpA7w6T_4BSjxjzTJJ5g/viewform?embedded=true" width="640" height="720" frameborder="0" marginheight="0" marginwidth="0">Загрузка…</iframe>
        </div>
    `;

    const script = document.createElement('script');
    script.src = 'https://forms.yandex.ru/_static/embed.js';
    document.body.appendChild(script);

    // Добавляем обработчик для кнопки копирования
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        copyToClipboard(uniqueCode);
    });
}

// Инициализация
buildQuiz();

// События
prevButton.addEventListener('click', () => showQuestion(currentQuestion - 1));
checkButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', () => showQuestion(currentQuestion + 1));
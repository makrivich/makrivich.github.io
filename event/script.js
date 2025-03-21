const quizData = [
    {
        question: "Как называется наша галактика?",
        type: "radio",
        options: ["Андромеда", "Млечный Путь", "Туманность Ориона"],
        correct: "Млечный Путь"
    },
    {
        question: "Как называется естественный спутник Земли?",
        type: "text",
        correct: "Луна"
    },
    {
        question: "Какие из этих объектов являются звездами?",
        type: "checkbox",
        options: ["Солнце", "Луна", "Сириус", "Марс"],
        correct: ["Солнце", "Сириус"]
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
                <label>
                    <input type="radio" name="question${index}" value="${option}">
                    ${option}
                </label><br>
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

        if (quizData[currentQuestion].type === "radio" || quizData[currentQuestion].type === "text") {
            isCorrect = selected === correct;
        } else if (quizData[currentQuestion].type === "checkbox") {
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
    }

    updateFeedback();

    checkButton.style.display = 'none';
    if (currentQuestion < quizData.length - 1) {
        nextButton.style.display = 'inline';
    } else {
        setTimeout(showResults, 1000);
    }
}

// Генерация 6-значного кода с последней цифрой как количеством баллов
function generateCode(score) {
    // Генерируем 5 случайных цифр (от 10000 до 99999)
    const baseNumber = Math.floor(10000 + Math.random() * 90000);
    // Добавляем количество баллов как последнюю цифру
    return `${baseNumber}${score}`;
}

// Показать результаты
function showResults() {
    let score = 0;
    quizData.forEach((question, index) => {
        if (question.type === "radio" || question.type === "text") {
            if (answers[index] === question.correct) score++;
        } else if (question.type === "checkbox") {
            if (JSON.stringify(answers[index]?.sort()) === JSON.stringify(question.correct.sort())) score++;
        }
    });

    const uniqueCode = generateCode(score); // Передаем score в функцию

    quizContainer.style.display = 'none';
    prevButton.style.display = 'none';
    checkButton.style.display = 'none';
    nextButton.style.display = 'none';
    resultContainer.style.display = 'block';

    resultContainer.innerHTML = `
        Викторина завершена! Вы набрали ${score} из ${quizData.length} баллов!
        <br><br>
        Ваш уникальный код: <strong>${uniqueCode}</strong>
        <br><br>
        <div id="yandex-form-container">
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSc46otjgrk50k1CsN0_IX1nXHKPcuPpA7w6T_4BSjxjzTJJ5g/viewform?embedded=true" width="640" height="720" frameborder="0" marginheight="0" marginwidth="0">Загрузка…</iframe>
        </div>
    `;

    const script = document.createElement('script');
    script.src = 'https://forms.yandex.ru/_static/embed.js';
    document.body.appendChild(script);
}

// Инициализация
buildQuiz();

// События
prevButton.addEventListener('click', () => showQuestion(currentQuestion - 1));
checkButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', () => showQuestion(currentQuestion + 1));

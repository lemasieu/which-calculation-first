let correctAnswers = 0;
let totalQuestions = 0;
let currentCorrectOptions = [];
let isAnswered = false;

function generateSubExpression(hasPower = false, allowOperation = true) {
    const decimals = [0.1, 0.2, 0.25, 0.5, 0.75, 1.5, 2.75];
    const fractions = ['\\frac{1}{4}', '\\frac{1}{3}', '\\frac{1}{2}', '\\frac{3}{4}', '\\frac{2}{3}'];
    const operations = ['+', '-', '*', '/'];
    const numbers = [...decimals.map(n => n.toString().replace('.', ',')), ...fractions];
    let parts = [numbers[Math.floor(Math.random() * numbers.length)]];

    if (allowOperation && Math.random() < 0.5) {
        parts.push(operations[Math.floor(Math.random() * operations.length)]);
        parts.push(numbers[Math.floor(Math.random() * numbers.length)]);
        parts = ['(' + parts.join(' ') + ')'];
    }

    if (hasPower) {
        let power = '{2}';
        if (parts.length > 1) {
            parts = ['\\left(' + parts.join(' ').replace(/[\(\)]/g, '') + '\\right)^{' + power + '}'];
        } else {
            parts = [parts[0] + '^{' + power + '}'];
        }
    }

    return parts.join('').replace(/\//g, ':').replace(/\*/g, '.');
}

function generateExpression() {
    let centerExpr = generateSubExpression(true, true);
    let leftExpr = generateSubExpression(false, Math.random() < 0.5);
    let rightExpr = generateSubExpression(false, Math.random() < 0.5);
    let operatorLeft = Math.random() < 0.5 ? '+' : '-';
    let operatorRight = Math.random() < 0.5 ? '+' : '-';

    let expression = '';
    expression += leftExpr;
    expression += ' ' + operatorLeft + ' ';
    expression += centerExpr;
    expression += ' ' + operatorRight + ' ';
    expression += rightExpr;

    let correctParts = [];
    const extractPriority = (expr) => {
        let parts = [];
        let hasUnbracketedPriority = /[\d,.:]+[:.][\d,.:]+/.test(expr) && !expr.includes('\\left(');
        if (hasUnbracketedPriority) {
            let match;
            const regex = /\\left\(([^)]+)\)\\right/g;
            while ((match = regex.exec(expr)) !== null) {
                parts.push(match[1]);
            }
        } else {
            if (expr.includes('^')) {
                if (expr.includes('\\left(')) {
                    let powerIndex = expr.indexOf('^');
                    let startIndex = expr.indexOf('\\left(') + 6;
                    let innerExpr = expr.slice(startIndex, powerIndex).replace(/\//g, ':').replace(/\*/g, '.');
                    parts.push(innerExpr);
                } else {
                    let powerIndex = expr.indexOf('^');
                    let base = expr.slice(0, powerIndex).replace(/\//g, ':').replace(/\*/g, '.');
                    parts.push(base + '^{2}');
                }
            }
            let match;
            const regex = /([\d,.:]+)([:.])([\d,.:]+)/g;
            while ((match = regex.exec(expr)) !== null) {
                parts.push(match[0]);
            }
        }
        return parts.filter(part => /[.:]/.test(part) || (part.includes('^') && !/^\d+,\d+$/.test(part)));
    };

    [leftExpr, centerExpr, rightExpr].forEach(expr => {
        let priorityParts = extractPriority(expr);
        correctParts.push(...priorityParts.filter(part => part && part.trim().length > 0));
    });

    return { expression, correct: correctParts.length ? correctParts : [centerExpr], leftExpr, centerExpr, rightExpr };
}

function generateQuestion() {
    const { expression, correct, leftExpr, centerExpr, rightExpr } = generateExpression();
    currentCorrectOptions = correct.filter(part => part && part.trim().length > 0);

    let options = [leftExpr, centerExpr, rightExpr];
    let randomPower = generateSubExpression(true, Math.random() < 0.5);
    while (options.includes(randomPower)) {
        randomPower = generateSubExpression(true, Math.random() < 0.5);
    }
    options.push(randomPower);

    let finalCorrectOptions = [];
    if (!/^\d+,\d+$|^\frac{\d+}{\d+}$/.test(leftExpr) && /[+\-.:]/.test(leftExpr)) {
        finalCorrectOptions.push(leftExpr);
    }
    finalCorrectOptions.push(centerExpr);
    if (!/^\d+,\d+$|^\frac{\d+}{\d+}$/.test(rightExpr) && /[+\-.:]/.test(rightExpr)) {
        finalCorrectOptions.push(rightExpr);
    }
    currentCorrectOptions = [...new Set(finalCorrectOptions)].filter(part => part && part.trim().length > 0);

    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]]; // Sửa lỗi cú pháp ở đây
    }

    const mathDiv = document.getElementById('math-expression');
    mathDiv.innerHTML = '';
    if (typeof MathJax !== 'undefined') {
        mathDiv.innerHTML = `\\(${expression}\\)`;
        MathJax.typesetPromise().then(() => {
            document.getElementById('checkButton').disabled = false;
        }).catch(err => {
            console.log('MathJax error:', err);
            document.getElementById('checkButton').disabled = false;
        });
    } else {
        mathDiv.textContent = expression;
        document.getElementById('checkButton').disabled = false;
    }

    const optionsDiv = document.getElementById('options-container');
    optionsDiv.innerHTML = options.map((opt, index) => `
        <div class="option">
            <input type="checkbox" id="option${index}" value="${opt}">
            <label for="option${index}" id="label${index}">${opt}</label>
        </div>
    `).join('');

    options.forEach((opt, index) => {
        const label = document.getElementById(`label${index}`);
        if (typeof MathJax !== 'undefined') {
            label.innerHTML = `\\(${opt}\\)`;
            MathJax.typesetPromise().catch(err => console.log('MathJax render error:', err));
        }
    });

    document.getElementById('result').innerHTML = '';
    isAnswered = false;
    document.getElementById('nextButton').disabled = true;
}

function startQuiz() {
    generateQuestion();
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('checkButton').style.display = 'inline-block';
}

function checkAnswer() {
    const selectedOptions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(input => input.value);

    const isCorrect = selectedOptions.length === currentCorrectOptions.length &&
        selectedOptions.every(opt => currentCorrectOptions.includes(opt)) &&
        currentCorrectOptions.every(opt => selectedOptions.includes(opt));

    totalQuestions++;
    if (isCorrect) correctAnswers++;

    document.getElementById('correct').textContent = correctAnswers;
    document.getElementById('total').textContent = totalQuestions;
    document.getElementById('percentage').textContent =
        totalQuestions > 0 ? ((correctAnswers / totalQuestions * 100).toFixed(2) + '%') : '0%';

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = isCorrect
        ? '<span style="color: green;">Đúng!</span>'
        : `<span style="color: red;">Sai! Đáp án đúng là: <span id="correct-answers"></span></span>`;
    if (!isCorrect && typeof MathJax !== 'undefined') {
        document.getElementById('correct-answers').innerHTML = currentCorrectOptions.map(opt => `\\(${opt}\\)`).join(', ');
        MathJax.typesetPromise().catch(err => console.log('MathJax error in result:', err));
    } else if (!isCorrect) {
        document.getElementById('correct-answers').textContent = currentCorrectOptions.join(', ');
    }

    isAnswered = true;
    document.getElementById('nextButton').disabled = false;
    document.getElementById('checkButton').disabled = true;
}

window.onload = function() {
    // Không tự động gọi generateQuestion khi tải trang
};
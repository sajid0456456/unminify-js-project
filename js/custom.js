window.tabSize = parseInt(document.getElementById("tabSizeSelector").value);
let currentTab = 'input';
let view = 'single';
let canCopy = true;
let fontLoaded = false;
const input = document.getElementById("inputEditor");
const output = document.getElementById("outputEditor");

outputEditor
const unminifyBtn = document.getElementById("unminifyBtn");

function detectLanguage(code) {
  const trimmed = code.trim();
  if (trimmed.startsWith('<?xml')) return 'xml';
  try { JSON.parse(trimmed); return 'json'; } catch (e) {}
  if (/<(html|!DOCTYPE|head|body|div|span|script|style|link|meta)[\s>]/i.test(trimmed)) return 'html';
  if (
    /^[\s\S]*:[\s\S]*;/.test(trimmed) &&
    /^[^{]*{[^}]*}$/.test(trimmed) &&
    !/function|=>/.test(trimmed.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))
  ) return 'css';
  if (/function|=>|var |let |const /.test(trimmed) || /[;{}()=]/.test(trimmed)) return 'js';
  return 'unknown';
}

function showTab(tab) {
  currentTab = tab;
  const inputEditor = document.getElementById("inputEditor");
  const outputEditor = document.getElementById("outputEditor");
  const tabInput = document.getElementById("tabInput");
  const tabOutput = document.getElementById("tabOutput");
  const inputSize = document.getElementById("inputSize");
  const outputSize = document.getElementById("outputSize");
  inputEditor.style.display = tab === 'input' || view === 'dual' ? 'block' : 'none';
  outputEditor.style.display = tab === 'output' || view === 'dual' ? 'block' : 'none';
  tabInput.style.background = tab === 'input' ? '#f5f5f5' : '#fff';
  tabOutput.style.background = tab === 'output' ? '#f5f5f5' : '#fff';
  if (view === 'dual') {
      inputSize.classList.remove("hide");
      outputSize.classList.remove("hide");
  } else {
      tab === 'input' ? inputSize.classList.remove("hide") : inputSize.classList.add("hide");
      tab === 'output' ? outputSize.classList.remove("hide") : outputSize.classList.add("hide");
  }
}

function unminifyAuto() {
  const input = document.getElementById("inputEditor").value.trim();
  if (!input) return;
  
  const outputEditor = document.getElementById("outputEditor");
  const errorDiv = document.getElementById("errorMessage");
  const force = document.getElementById("forceLang").value;
  const type = (force !== "auto") ? force : detectLanguage(input);
  let output = "";
  const tabSize = window.tabSize || 4;
  document.getElementById("inputEditor").style.backgroundColor = "";
  document.getElementById("inputEditor").removeAttribute("title");

  try {
    switch (type) {
      case "js": output = js_beautify(input, { indent_size: tabSize }); break;
      case "html": output = html_beautify(input, { indent_size: tabSize }); break;
      case "css": output = css_beautify(input, { indent_size: tabSize }); break;
      case "json": output = JSON.stringify(JSON.parse(input), null, tabSize); break;
      case "xml": output = vkbeautify.xml(input, tabSize); break;
      default:
        outputEditor.value = '';
        errorDiv.textContent = '';
        const inputBox = document.getElementById("inputEditor");
        inputBox.style.backgroundColor = "#ffeaea";
        inputBox.setAttribute("title", "Sorry, we couldn't detect the code type. Please select manually.");
        inputBox.focus();
        return;
    }
  } catch (e) {
    output = `Error: ${e.message || 'Invalid input or formatting failed.'}`;
    errorDiv.textContent = output;
  }
  outputEditor.value = output;
  showTab('output');
  const byteIndicator = document.querySelectorAll(".byte-indicator");
  updateByteIndicators();
  byteIndicator.forEach(i => i.classList.remove("hide"));
  document.getElementById("downloadBtn").style.display = "flex";
}

function clearCode() {
  input.style.backgroundColor = "";
  input.removeAttribute("title");
  document.getElementById("inputEditor").value = '';
  document.getElementById("outputEditor").value = '';
  showTab('input');
  var byteIndicator = document.querySelectorAll(".byte-indicator");
  byteIndicator.forEach(i => i.classList.remove("hide"));
  updateByteIndicators()
}

function copyCode() {
  if (!canCopy) return;
  const text = document.getElementById("outputEditor").value;
  navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("copyBtn");
      if (window.innerWidth > 600) {
      btn.textContent = "Copied!";
      canCopy = false;
      setTimeout(() => {
          btn.innerHTML = "<img src='imgs/copy.svg' width='15px' alt='copy unminified code'> Copy Output";
          btn.disabled = false;
          canCopy = true;
      }, 1000);
    }
  });
}

function updateTabSize(value) {
  const tabSize = parseInt(value);
  window.tabSize = tabSize;
}

function setLayout(type) {
  const wrapper = document.getElementById("editorWrapper");
  const tabButtons = document.querySelector(".tab-buttons");
  const tabOutputMain = document.getElementById("tabOutput");
  const tabOutputSplit = document.getElementById("tabOutput-splitView");
  const singleBtn = document.getElementById('singleBtn');
  const splitBtn = document.getElementById('splitBtn');
  view = type;
  if (type === 'dual') {
      wrapper.classList.add("split-layout");
      tabOutputMain.style.display = "none";
      tabOutputSplit.style.display = "block";
      splitBtn.style.display = "none";
      singleBtn.style.display = "inline-block";
      showTab(currentTab);
  } else {
      wrapper.classList.remove("split-layout");
      tabButtons.style.display = "flex";
      tabOutputMain.style.display = "inline-block";
      tabOutputSplit.style.display = "none";
      singleBtn.style.display = "none";
      splitBtn.style.display = "inline-block";
      showTab(currentTab);
  }
}

function updateByteIndicators() {
  const inputBytes = new Blob([document.getElementById("inputEditor").value]).size;
  const outputBytes = new Blob([document.getElementById("outputEditor").value]).size;
  document.getElementById("inputSize").innerText = `${inputBytes} Bytes`;
  document.getElementById("outputSize").innerText = `${outputBytes} Bytes`;
}

function saveCode() {
  const code = document.getElementById('outputEditor').value;
  const forcedLang = document.getElementById("forceLang").value;
  const type = (forcedLang !== "auto") ? forcedLang : detectLanguage(code);
  const extMap = { js: 'js', html: 'html', css: 'css', json: 'json', xml: 'xml' };
  const ext = extMap[type] || 'txt';
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `unminified-code.${ext}`;
  a.click();
}

function loadCode(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
      const inputText = e.target.result;
      document.getElementById("inputEditor").value = inputText;
      updateByteIndicators();
  };
  reader.readAsText(event.target.files[0]);
}

input.addEventListener("input", () => {
  input.style.backgroundColor = "";
  input.removeAttribute("title");
  updateByteIndicators();

  if (!fontLoaded) {
    const font = new FontFace('PT Mono', 'url(../fonts/PTMono-Regular.ttf)');
    font.load().then(loadedFont => {
      document.fonts.add(loadedFont);
      input.style.fontFamily = "'PT Mono', monospace";
      fontLoaded = true;
    }).catch(err => {
      console.error("Font load failed:", err);
    });
  }
});

output.addEventListener("input", updateByteIndicators);

const forced = document.getElementById("forceLang").value;
const type = forced !== "auto" ? forced : detectLanguage(input.value);
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") unminifyAuto();
});

document.addEventListener('click', function loadScriptsOnce() {
document.removeEventListener('click', loadScriptsOnce);

const scripts = [
  'js/beautify.js',
  'js/beautify-html.js',
  'js/beautify-css.js',
  'js/vkbeautify.js'
];

scripts.forEach(src => {
  const s = document.createElement('script');
  s.src = src;
  document.body.appendChild(s);
});
});



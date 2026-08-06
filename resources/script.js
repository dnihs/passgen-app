// DOM Elements - all the elements we need from HTML
const html = document.documentElement;
const version = document.getElementById("version");
const switcher = document.getElementById("theme-switcher");
const lightBtn = document.getElementById("light-theme");
const darkBtn = document.getElementById("dark-theme");
const lengthInput = document.getElementById("length");
const lengthOutput = document.getElementById("length-value");
const passwordInput = document.getElementById("password");
const copyBtn = document.getElementById("copy-btn");
const copyToast = document.getElementById("copy-toast");
const oneCharToast = document.getElementById("onechar-toast");
const uppercaseCheckbox = document.getElementById("uppercase");
const lowercaseCheckbox = document.getElementById("lowercase");
const numbersCheckbox = document.getElementById("numbers");
const symbolsCheckbox = document.getElementById("symbols");
const generateButton = document.getElementById("generate-btn");
const strengthBar = document.querySelector(".strength-bar");
const strengthText = document.querySelector(".strength-container p");
const strengthLabel = document.getElementById("str-label");

// Character sets
const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const numberCharacters = "0123456789";
const symbolCharacters = "!@#$%^&*()-_=+[]{}/|;:,.<>`~'\"\\?";

// Bootstrap toasts
const toast1 = new bootstrap.Toast(copyToast, { delay: 1000 });
const toast2 = new bootstrap.Toast(oneCharToast, { delay: 1500 });

// Version
version.textContent = "v0.0.5-Demo";

// Theme Switcher
function setTheme(theme) {
  html.dataset.bsTheme = theme;
  localStorage.setItem("theme", theme);

  switcher.classList.toggle("is-dark", theme === "dark");
  lightBtn.classList.toggle("active", theme === "light");
  darkBtn.classList.toggle("active", theme === "dark");
}
setTheme(localStorage.getItem("theme") || "dark");
lightBtn.addEventListener("click", () => setTheme("light"));
darkBtn.addEventListener("click", () => setTheme("dark"));

// Range output

// Setting intial value
lengthOutput.textContent = lengthInput.value;
// Dynamic modify
lengthInput.addEventListener("input", (e) => {
  lengthOutput.textContent = e.target.value;
});

// Generate button event listener
generateButton.addEventListener("click", createPassword);

// Create password function - validates inputs and direct towards generation
function createPassword() {
  // Get the inputs
  const length = Number(lengthInput.value);
  const includeUpperCase = uppercaseCheckbox.checked;
  const includeLowercase = lowercaseCheckbox.checked;
  const includeNumbers = numbersCheckbox.checked;
  const includeSymbols = symbolsCheckbox.checked;

  if (
    !includeUpperCase &&
    !includeLowercase &&
    !includeNumbers &&
    !includeSymbols
  ) {
    toast2.show();
    return;
  }

  const newPassword = createRandomPassword(
    length,
    includeUpperCase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  );
  // Update Password
  passwordInput.value = newPassword;

  // Update Strength meter
  updateStrengthMeter(newPassword);
}

// CreateRandomPassword function - Create a near random password using Math library
// Should not be used for real wolrd scenarios
function createRandomPassword(
  length,
  includeUpperCase,
  includeLowercase,
  includeNumbers,
  includeSymbols,
) {
  let allCharacters = "";

  if (includeUpperCase) allCharacters += uppercaseLetters;
  if (includeLowercase) allCharacters += lowercaseLetters;
  if (includeNumbers) allCharacters += numberCharacters;
  if (includeSymbols) allCharacters += symbolCharacters;

  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    password += allCharacters[randomIndex];
  }
  return password;
}

// updateStrengthMeter function - updates the strength meter according to the generate password
function updateStrengthMeter(password) {
  const passwordLength = password.length;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);

  // Iterate through an array of allowed symbols and return true if any are found in the password.
  const hasSymbols = [...symbolCharacters].some((ch) => password.includes(ch));

  let strengthScore = 0;

  // Math.min returns the minimum value,
  // But at maximum it will return 40
  strengthScore = +Math.min(passwordLength * 2, 40);

  if (hasUpperCase) strengthScore += 15;
  if (hasLowerCase) strengthScore += 15;
  if (hasNumbers) strengthScore += 15;
  if (hasSymbols) strengthScore += 15;

  if (passwordLength < 12) {
    // Enforce minimum score for every short password
    strengthScore = Math.min(strengthScore, 40);
  }

  // Ensure the width of the strength bar is a valid percentage
  const safeScore = Math.max(5, Math.min(100, strengthScore));
  strengthBar.style.width = safeScore + "%";

  let strengthLabelText = "";
  let barColor = "";

  if (strengthScore < 40) {
    // weak password
    barColor = "#cd1946";
    strengthLabelText = "Weak";
  } else if (strengthScore < 70) {
    // Medium password
    barColor = "#eae600";
    strengthLabelText = "Medium";
  } else {
    // Strong password
    barColor = "#02e47b";
    strengthLabelText = "Strong";
  }

  strengthBar.style.backgroundColor = barColor;
  strengthLabel.textContent = strengthLabelText;
}

// Change copy icon for a second to ack. write to clipboard
function showCopySuccess() {
  copyBtn.classList.remove("bi-copy");
  copyBtn.classList.add("bi-check-lg");
  copyBtn.title = "Copied!";

  setTimeout(() => {
    copyBtn.classList.remove("bi-check-lg");
    copyBtn.classList.add("bi-copy");
    copyBtn.title = "Copy to clipboard";
  }, 1000);
}

// Copy button logic and clipboard setup
copyBtn.addEventListener("click", async () => {
  if (!passwordInput.value) return;

  try {
    await navigator.clipboard.writeText(passwordInput.value);
    toast1.show();
    showCopySuccess();
  } catch (error) {
    console.error("Unable to copy password", error);
    passwordInput.select();
    document.execCommand("copy");
    toast1.show();
  }
});

// Block webview zoom - wheel control
document.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false },
);

// Block webview zoom - Key control
document.addEventListener("keydown", (e) => {
  if (
    e.ctrlKey &&
    (e.key === "+" || e.key === "-" || e.key === "0" || e.key === "=")
  ) {
    e.preventDefault();
  }
});

// Block context Menu
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Run the generator as soon as the app loads
window.addEventListener("DOMContentLoaded", createPassword);

// Space key rolls passwords
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    createPassword();
  }
});

// ctrl+c or c for copying to clipboard
document.addEventListener("keydown", (e) => {
  if (
    (e.ctrlKey && e.key.toLowerCase() === "c") ||
    e.key.toLowerCase() === "c"
  ) {
    e.preventDefault();
    if (!passwordInput.value) return;

    // Copy operation
    navigator.clipboard
      .writeText(passwordInput.value)
      .then(() => {
        toast1.show();
        showCopySuccess();
      })
      .catch(() => {
        passwordInput.select();
        document.execCommand("copy");
        toast1.show();
        showCopySuccess();
      });
  }
});

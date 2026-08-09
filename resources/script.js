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
const entropyLabel = document.getElementById("ent-label");
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
version.textContent = "v0.1.6";

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
  const { password: newPassword, poolSize } = createRandomPassword(
    length,
    includeUpperCase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  );

  passwordInput.value = newPassword;
  updateStrengthMeter(newPassword, poolSize);
}

// CreateRandomPassword function - Create a near random password using webcrypto
// Returns both the password AND the pool size it was drawn from, computed
// once here since this is the only place that builds allCharacters.
function createRandomPassword(
  length,
  includeUpperCase,
  includeLowercase,
  includeNumbers,
  includeSymbols,
) {
  // Building the charset
  let allCharacters = "";

  if (includeUpperCase) allCharacters += uppercaseLetters;
  if (includeLowercase) allCharacters += lowercaseLetters;
  if (includeNumbers) allCharacters += numberCharacters;
  if (includeSymbols) allCharacters += symbolCharacters;

  // 255 byte array with enough buffer to reject
  const pwdarray = new Uint8Array(length * 2);
  // Randomized numbers
  crypto.getRandomValues(pwdarray);

  let password = "";
  let i = 0;

  while (password.length < length && i < pwdarray.length) {
    // Get each number
    const byte = pwdarray[i++];

    // Check for modulo bias - essentially removing unfair leftovers
    // Very small bias but its better to address than ship vuln.
    if (byte < 256 - (256 % allCharacters.length)) {
      // Apppend the password
      password += allCharacters[byte % allCharacters.length];
    }
  }

  if (password.length !== length) {
    return createRandomPassword(
      length,
      includeUpperCase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    );
  }

  // return both computed
  return { password, poolSize: allCharacters.length };
}

// calculateEntropy function - Calculates the entropy value
function calculateEntropy(passwordLength, charPoolSize) {
  if (charPoolSize === 0) return 0;
  return passwordLength * Math.log2(charPoolSize);
}

// updateStrengthMeter function - converts entropy (bits) into a label,
// color, and bar width for the UI.
function updateStrengthMeter(password, poolSize) {
  const passwordLength = password.length;

  // Calculate the entropy
  const bits = calculateEntropy(passwordLength, poolSize);
  let label, color;
  if (bits < 60) {
    label = "Weak";
    color = "#cd1946";
  } else if (bits < 100) {
    label = "Medium";
    color = "#eae600";
  } else if (bits < 180) {
    label = "Strong";
    color = "#02e47b";
  } else {
    label = "Excellent";
    color = "#00c2ff";
  }

// Try to convert bits -> percentage
// Capped at 100 becuase of the bar limit, any above 100 bits shows full bar 
  const displayPercent = Math.min(100, (bits / 100) * 100);

  // Setting the CSS
  strengthBar.style.width = displayPercent + "%";
  strengthBar.style.backgroundColor = color;
  strengthLabel.textContent = label;
  entropyLabel.textContent = `${Math.round(bits)}`;
}

// About the thresholds I used,

// Thresholds are rough real-world reference points, not exact security
// boundaries:
//   < 60 bits  = crackable offline within a plausible timeframe by a
//                well-resourced attacker -> Weak
//   60-100     = impractical to brute-force today -> Medium
//   100-180    = far beyond AES-128 equivalent -> Strong
//   180+       = existing purely in theoretical territory -> Excellent




// Change copy icon for a second to ack. the write to clipboard
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

// Run the generator as soon as the slider changes
lengthInput.addEventListener("input", () => {
  createPassword();
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

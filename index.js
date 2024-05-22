const colorRadio = document.getElementById("color-radio");
const colorInput = document.getElementById("color-input");

colorRadio.addEventListener("change", () => {
  colorInput.value = colorRadio.value;
  computeVal(colorInput.value);
});

colorInput.addEventListener("input", () => {
  computeVal(colorInput.value);

  switch (colorInput.value.length) {
    case 4:
      colorRadio.value = "#" + hexexpand(colorInput.value);
      break;
    case 7:
      colorRadio.value = colorInput.value;
      break;
    default:
      colorRadio.value = "#000000";
      break;
  }
});

// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
function expandHex(hextexp) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hextexp = hextexp.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  return hextexp;
}

function rgbToHex(r, g, b) {
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  const expandedHex = expandHex(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function trimRgb(rgb) {
  const [r, g, b] = rgb
    .replace(/rgb\(|\) /i, "")
    .split(",")
    .map((x) => parseInt(x));
  return [r, g, b];
}


class Color {
  constructor(r, g, b) {
    this.set(r, g, b);
  }

  toRgb() {
    return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(
      this.b
    )})`;
  }

  toHex() {
    return rgbToHex(Math.round(this.r), Math.round(this.g), Math.round(this.b));
  }

  set(r, g, b) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  hueRotate(angle = 0) {
    angle = (angle / 180) * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    this.multiply([
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ]);
  }

  grayscale(value = 1) {
    this.multiply([
      0.2126 + 0.7874 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 + 0.2848 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 + 0.9278 * (1 - value),
    ]);
  }

  sepia(value = 1) {
    this.multiply([
      0.393 + 0.607 * (1 - value),
      0.769 - 0.769 * (1 - value),
      0.189 - 0.189 * (1 - value),
      0.349 - 0.349 * (1 - value),
      0.686 + 0.314 * (1 - value),
      0.168 - 0.168 * (1 - value),
      0.272 - 0.272 * (1 - value),
      0.534 - 0.534 * (1 - value),
      0.131 + 0.869 * (1 - value),
    ]);
  }

  saturate(value = 1) {
    this.multiply([
      0.213 + 0.787 * value,
      0.715 - 0.715 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 + 0.285 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 - 0.715 * value,
      0.072 + 0.928 * value,
    ]);
  }

  multiply(matrix) {
    const newR = this.clamp(
      this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]
    );
    const newG = this.clamp(
      this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]
    );
    const newB = this.clamp(
      this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]
    );
    this.r = newR;
    this.g = newG;
    this.b = newB;
  }

  brightness(value = 1) {
    this.linear(value);
  }
  contrast(value = 1) {
    this.linear(value, -(0.5 * value) + 0.5);
  }

  linear(slope = 1, intercept = 0) {
    this.r = this.clamp(this.r * slope + intercept * 255);
    this.g = this.clamp(this.g * slope + intercept * 255);
    this.b = this.clamp(this.b * slope + intercept * 255);
  }

  invert(value = 1) {
    this.r = this.clamp((value + (this.r / 255) * (1 - 2 * value)) * 255);
    this.g = this.clamp((value + (this.g / 255) * (1 - 2 * value)) * 255);
    this.b = this.clamp((value + (this.b / 255) * (1 - 2 * value)) * 255);
  }

  hsl() {
    // Code taken from https://stackoverflow.com/a/9493060/2688027, licensed under CC BY-SA.
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;

        case g:
          h = (b - r) / d + 2;
          break;

        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 100,
      s: s * 100,
      l: l * 100,
    };
  }

  clamp(value) {
    if (value > 255) {
      value = 255;
    } else if (value < 0) {
      value = 0;
    }
    return value;
  }
}

class Solver {
  constructor(target, baseColor) {
    this.target = target;
    this.targetHSL = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }

  solve() {
    const result = this.solveNarrow(this.solveWide());
    return {
      values: result.values,
      loss: result.loss,
      filter: this.css(result.values),
      filterRaw: this.raw(result.values),
    };
  }

  solveWide() {
    const A = 5;
    const c = 15;
    const a = [60, 180, 18000, 600, 1.2, 1.2];

    let best = { loss: Infinity };
    for (let i = 0; best.loss > 25 && i < 3; i++) {
      const initial = [50, 20, 3750, 50, 100, 100];
      const result = this.spsa(A, a, c, initial, 1000);
      if (result.loss < best.loss) {
        best = result;
      }
    }
    return best;
  }

  solveNarrow(wide) {
    const A = wide.loss;
    const c = 2;
    const A1 = A + 1;
    const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
    return this.spsa(A, a, c, wide.values, 500);
  }

  spsa(A, a, c, values, iters) {
    const alpha = 1;
    const gamma = 0.16666666666666666;

    let best = null;
    let bestLoss = Infinity;
    const deltas = new Array(6);
    const highArgs = new Array(6);
    const lowArgs = new Array(6);

    for (let k = 0; k < iters; k++) {
      const ck = c / Math.pow(k + 1, gamma);
      for (let i = 0; i < 6; i++) {
        deltas[i] = Math.random() > 0.5 ? 1 : -1;
        highArgs[i] = values[i] + ck * deltas[i];
        lowArgs[i] = values[i] - ck * deltas[i];
      }

      const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
      for (let i = 0; i < 6; i++) {
        const g = (lossDiff / (2 * ck)) * deltas[i];
        const ak = a[i] / Math.pow(A + k + 1, alpha);
        values[i] = fix(values[i] - ak * g, i);
      }

      const loss = this.loss(values);
      if (loss < bestLoss) {
        best = values.slice(0);
        bestLoss = loss;
      }
    }
    return { values: best, loss: bestLoss };

    function fix(value, idx) {
      let max = 100;
      if (idx === 2 /* saturate */) {
        max = 7500;
      } else if (idx === 4 /* brightness */ || idx === 5 /* contrast */) {
        max = 200;
      }

      if (idx === 3 /* hue-rotate */) {
        if (value > max) {
          value %= max;
        } else if (value < 0) {
          value = max + (value % max);
        }
      } else if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }
      return value;
    }
  }

  loss(filters) {
    // Argument is array of percentages.
    const color = this.reusedColor;
    color.set(0, 0, 0);

    color.invert(filters[0] / 100);
    color.sepia(filters[1] / 100);
    color.saturate(filters[2] / 100);
    color.hueRotate(filters[3] * 3.6);
    color.brightness(filters[4] / 100);
    color.contrast(filters[5] / 100);

    const colorHSL = color.hsl();
    return (
      Math.abs(color.r - this.target.r) +
      Math.abs(color.g - this.target.g) +
      Math.abs(color.b - this.target.b) +
      Math.abs(colorHSL.h - this.targetHSL.h) +
      Math.abs(colorHSL.s - this.targetHSL.s) +
      Math.abs(colorHSL.l - this.targetHSL.l)
    );
  }

  raw(filters) {
    function fmt(idx, multiplier = 1) {
      return Math.round(filters[idx] * multiplier);
    }
    return `brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(
      1
    )}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(
      4
    )}%) contrast(${fmt(5)}%)`;
  }

  css(filters) {
    function fmt(idx, multiplier = 1) {
      return Math.round(filters[idx] * multiplier);
    }
    return `filter: brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(
      1
    )}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(
      4
    )}%) contrast(${fmt(5)}%);`;
  }
}

function chgBG(val) {
  document.body.style.backgroundColor=val;
}

function computeVal(input) {
  if (input == '') input='#000';
  let rgb;

  if (isHEXValid(input)) {
    rgb = hexToRgb(input);
  } else if (isRGBValid(input)) {
    rgb = trimRgb(input);
  }

  const color = new Color(rgb[0], rgb[1], rgb[2]);
  const solver = new Solver(color);
  const result = solver.solve();
  let lossMsg = "";
  const res = {
    color,
    solver,
    result,
    lossMsg,
  };

  Array.from(document.getElementsByClassName('filtered-color')).forEach((elt) => {
    elt.style['filter']=res.result.filterRaw;
  });
  

  if (res.result.loss < 1) {
    res.lossMsg = "This is a perfect result.";
  } else if (res.result.loss < 5) {
    res.lossMsg = "The is close enough.";
  } else if (res.result.loss < 15) {
    res.lossMsg = "The color is somewhat off. Consider running it again.";
  } else {
    res.lossMsg = "The color is extremely off. Run it again!";
  }

  const filterPixel = document.getElementById("filterPixel");
  const filterPixelText = document.getElementById("filterPixelText");
  const lossDetail = document.getElementById("lossDetail");
  const rgbColor = color.toRgb();
  const hexColor = res.color.toHex();

  filterPixel.style.filter = String(res.result.filterRaw);
  filterPixel.style.webkitFilter = String(res.result.filterRaw);

  filterPixelText.innerText = res.result.filter;
  filterPixelText.parentElement.setAttribute(
    "data-clipboard-text",
    res.result.filter
  );

  lossDetail.innerHTML = `Loss: ${res.result.loss.toFixed(1)}. <b>${
    res.lossMsg
  }</b>`;
}

function compute() {
  computeVal(document.getElementById("color-input").value);
}

function isHEXValid(color) {
  const HEXColorRegExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const isValid = HEXColorRegExp.test(color);

  if (isValid) {
    return true;
  } else {
    return false;
  }
}

function isRGBValid(color) {
  const RGBColorRegExp = /^(rgb\()?\d{1,3}, ?\d{1,3}, ?\d{1,3}(\))?$/i;

  if (!RGBColorRegExp.test(color)) return false;

  color = color.toLowerCase();
  const startCheck = color.startsWith("rgb");
  const endCheck = color.endsWith(")");
  if ((startCheck && !endCheck) || (!startCheck && endCheck)) return false;

  const [r, g, b] = color
    .replace(/^rgb\(|\)| /, "")
    .split(",")
    .map((x) => parseInt(x));
  console.log(r, g, b);
  if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
    return true;
  } else {
    return false;
  }
}

function validateColor(color) {
  console.log("VAL");
  const submitButton = document.getElementById("action-button");

  if (isHEXValid(color) || isRGBValid(color)) {
    submitButton.classList.remove("disabled");
  } else if (!submitButton.classList.contains("disabled")) {
    submitButton.classList.add("disabled");
  }
}

function onStart() {
  const initialColor = new URLSearchParams(document.location.search).get(
    "color"
  );
  if (initialColor && isHEXValid(`#${initialColor}`)) {
    document
      .getElementById("color-input")
      .setAttribute("value", `#${initialColor}`);
    document
      .getElementById("color-radio")
      .setAttribute("value", `#${initialColor}`);
    validateColor(`#${initialColor}`);
    compute();
  }

  const copyableElements = document.querySelectorAll(".copyable");
  const copyEl = document.querySelectorAll(".pos");

  new ClipboardJS("span.copyable");

  copyableElements.forEach((el, index) => {
    el.addEventListener("click", () => {
      copyEl[index].classList.add("copied");

      setTimeout(() => {
        copyEl[index].classList.remove("copied");
      }, 1500);
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("color-input").removeAttribute("disabled");
  });
}

onStart();

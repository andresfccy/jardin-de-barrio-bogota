const formatMillions = (value) => {
  const sign = value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
};

const baseEnrollment = [12, 15, 18, 20, 22, 24, 25, 26, 27, 27, 28, 28, 25, 26, 27, 28, 28, 29, 29, 29, 30, 30, 30, 30];
const nonRentFixedBase = 26.7;

const controls = {
  capacity: document.querySelector("#capacity"),
  children: document.querySelector("#children"),
  price: document.querySelector("#price"),
  variable: document.querySelector("#variable"),
  fixed: document.querySelector("#fixed"),
};

const values = {
  capacity: document.querySelector("#capacityValue"),
  children: document.querySelector("#childrenValue"),
  price: document.querySelector("#priceValue"),
  variable: document.querySelector("#variableValue"),
  fixed: document.querySelector("#fixedValue"),
};

const results = {
  breakEven: document.querySelector("#breakEvenResult"),
  breakEvenPercent: document.querySelector("#breakEvenPercent"),
  revenue: document.querySelector("#revenueResult"),
  ebitda: document.querySelector("#ebitdaResult"),
  ebitdaState: document.querySelector("#ebitdaState"),
  rent: document.querySelector("#rentResult"),
};

const getModel = () => ({
  capacity: Number(controls.capacity.value),
  children: Number(controls.children.value),
  price: Number(controls.price.value),
  variable: Number(controls.variable.value),
  fixed: Number(controls.fixed.value),
});

const buildProjection = (model) => {
  let cumulative = 0;
  return baseEnrollment.map((planned, index) => {
    const children = Math.min(planned, model.capacity);
    const revenue = children * model.price;
    const variableCosts = children * model.variable;
    const ebitda = revenue - variableCosts - model.fixed;
    cumulative += ebitda;
    return {
      month: index + 1,
      children,
      occupancy: children / model.capacity,
      revenue,
      variableCosts,
      fixed: model.fixed,
      ebitda,
      cumulative,
    };
  });
};

const renderProjection = (model, breakEven) => {
  const body = document.querySelector("#projectionBody");
  const chart = document.querySelector("#occupancyChart");
  const projection = buildProjection(model);

  body.innerHTML = projection.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td><strong>${row.children}</strong></td>
      <td>${Math.round(row.occupancy * 100)}%</td>
      <td>${formatMillions(row.revenue)}</td>
      <td>${formatMillions(row.variableCosts)}</td>
      <td>${formatMillions(row.fixed)}</td>
      <td class="${row.ebitda >= 0 ? "positive" : "negative-text"}">${formatMillions(row.ebitda)}</td>
      <td class="${row.cumulative >= 0 ? "positive" : "negative-text"}">${formatMillions(row.cumulative)}</td>
    </tr>
  `).join("");

  chart.innerHTML = projection.map((row) => {
    const height = Math.max(4, row.occupancy * 100);
    return `<div class="chart-bar ${row.children >= breakEven ? "break-even" : ""}" style="height:${height}%" data-month="${row.month}" data-label="Mes ${row.month}: ${row.children} niños"></div>`;
  }).join("");

  return projection;
};

let currentProjection = [];

const updateCalculator = () => {
  const model = getModel();
  controls.children.max = String(model.capacity);
  if (model.children > model.capacity) {
    controls.children.value = String(model.capacity);
    model.children = model.capacity;
  }

  const contribution = model.price - model.variable;
  const breakEven = contribution > 0 ? Math.ceil(model.fixed / contribution) : Infinity;
  const occupancy = Number.isFinite(breakEven) ? breakEven / model.capacity : Infinity;
  const revenue = model.children * model.price;
  const ebitda = model.children * contribution - model.fixed;
  const maxRent = Math.max(0, model.children * contribution - nonRentFixedBase);

  values.capacity.textContent = model.capacity;
  values.children.textContent = model.children;
  values.price.textContent = formatMillions(model.price);
  values.variable.textContent = formatMillions(model.variable);
  values.fixed.textContent = formatMillions(model.fixed);

  results.breakEven.textContent = Number.isFinite(breakEven) ? `${breakEven} niños` : "No calculable";
  results.breakEvenPercent.textContent = Number.isFinite(occupancy)
    ? `${Math.round(occupancy * 100)}% de ocupación${occupancy > 1 ? " · imposible" : ""}`
    : "El precio no cubre el variable";
  results.revenue.textContent = formatMillions(revenue);
  results.ebitda.textContent = formatMillions(ebitda);
  results.ebitda.classList.toggle("negative", ebitda < 0);
  results.ebitdaState.textContent = ebitda < 0
    ? "El mes consume caja"
    : ebitda < 2
      ? "Mes apenas positivo"
      : "Mes con margen operativo";
  results.rent.textContent = formatMillions(maxRent);

  currentProjection = renderProjection(model, breakEven);
};

Object.values(controls).forEach((control) => control?.addEventListener("input", updateCalculator));
updateCalculator();

document.querySelector("#downloadCsv")?.addEventListener("click", () => {
  const headers = ["mes", "ninos", "ocupacion_pct", "ingresos_millones", "variables_millones", "fijos_millones", "ebitda_millones", "acumulado_millones"];
  const rows = currentProjection.map((row) => [
    row.month,
    row.children,
    Math.round(row.occupancy * 100),
    row.revenue.toFixed(2),
    row.variableCosts.toFixed(2),
    row.fixed.toFixed(2),
    row.ebitda.toFixed(2),
    row.cumulative.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "proyeccion-jardin-24-meses.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll("[data-print]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

const menuButton = document.querySelector("#menuButton");
const mainNav = document.querySelector("#mainNav");
menuButton?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

const navLinks = [...document.querySelectorAll(".main-nav a")];
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.2, 0.5] });
  observedSections.forEach((section) => observer.observe(section));
}

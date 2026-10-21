(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Physics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const specs = {
    projectile: {
      title: 'Projectile motion',
      formula: 'y = h + v sin(θ)t − ½gt²; x = v cos(θ)t',
      assumptions: 'Point mass, constant gravity, no air resistance, flat ground at y = 0.',
      fields: [
        ['speed', 'Launch speed', 'm/s', 25, 0, 10000],
        ['angle', 'Launch angle', 'deg', 45, 0, 90],
        ['height', 'Initial height', 'm', 0, 0, 100000],
        ['gravity', 'Gravity', 'm/s²', 9.80665, 0.0001, 1000],
      ],
    },
    spring: {
      title: 'Mass–spring oscillator',
      formula: 'ω = √(k/m); x(t) = A cos(ωt)',
      assumptions: 'Undamped linear spring; initial displacement A and initial velocity zero.',
      fields: [
        ['mass', 'Mass', 'kg', 1, 0.000001, 1e9],
        ['stiffness', 'Spring stiffness', 'N/m', 40, 0.000001, 1e12],
        ['amplitude', 'Amplitude', 'm', 0.15, 0, 1e6],
        ['duration', 'Time window', 's', 5, 0.001, 10000],
      ],
    },
    rc: {
      title: 'RC charging circuit',
      formula: 'τ = RC; Vc(t) = Vs(1 − exp(−t/RC))',
      assumptions: 'Ideal DC source and components; capacitor initially uncharged.',
      fields: [
        ['voltage', 'Source voltage', 'V', 5, 0, 1e6],
        ['resistance', 'Resistance', 'Ω', 1000, 0.000001, 1e12],
        ['capacitance', 'Capacitance', 'F', 0.001, 1e-12, 1e6],
      ],
    },
    beam: {
      title: 'Cantilever tip deflection',
      formula: 'δ = FL³/(3EI); σmax = FLc/I',
      assumptions:
        'Uniform Euler–Bernoulli beam, fixed end, tip force, small deflections, linear elastic material. No buckling or safety-factor assessment.',
      fields: [
        ['force', 'Tip load', 'N', 100, 0, 1e12],
        ['length', 'Beam length', 'm', 1, 0.000001, 100000],
        ['modulus', 'Young’s modulus', 'Pa', 200e9, 1, 1e15],
        ['inertia', 'Second moment of area', 'm⁴', 8.33e-8, 1e-20, 1e10],
        ['outerFiber', 'Neutral axis to outer fiber', 'm', 0.025, 1e-9, 1e6],
      ],
    },
    ohm: {
      title: 'Ohm’s law',
      formula: 'I = V/R; P = VI',
      assumptions: 'Ideal linear resistor under steady DC conditions.',
      fields: [
        ['voltage', 'Voltage', 'V', 12, -1e9, 1e9],
        ['resistance', 'Resistance', 'Ω', 100, 1e-12, 1e15],
      ],
    },
    force: {
      title: 'Newton’s second law',
      formula: 'F = ma',
      assumptions: 'Constant mass, inertial reference frame, classical mechanics.',
      fields: [
        ['mass', 'Mass', 'kg', 10, 0, 1e15],
        ['acceleration', 'Acceleration', 'm/s²', 2, -1e9, 1e9],
      ],
    },
    kinetic: {
      title: 'Kinetic energy',
      formula: 'E = ½mv²',
      assumptions: 'Translational motion in the nonrelativistic regime.',
      fields: [
        ['mass', 'Mass', 'kg', 2, 0, 1e15],
        ['speed', 'Speed', 'm/s', 10, 0, 3e6],
      ],
    },
    thermal: {
      title: 'Sensible heat',
      formula: 'Q = mcΔT',
      assumptions: 'Constant specific heat; no phase change or heat loss.',
      fields: [
        ['mass', 'Mass', 'kg', 1, 0, 1e12],
        ['specificHeat', 'Specific heat', 'J/(kg·K)', 4184, 0.000001, 1e9],
        ['deltaTemperature', 'Temperature change', 'K', 20, -1e6, 1e6],
      ],
    },
  };
  function calculate(kind, raw) {
    if (!Object.hasOwn(specs, kind)) throw new Error('Unknown calculation.');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('Inputs must be an object.');
    const spec = specs[kind],
      p = {};
    for (const [key, label, unit, , min, max] of spec.fields) {
      const value = raw[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
        throw new Error(`${label} must be a finite number between ${min} and ${max} ${unit}.`);
      p[key] = value;
    }
    if (Object.keys(raw).some((key) => !spec.fields.some((f) => f[0] === key)))
      throw new Error('Unexpected input field.');
    const values = [],
      points = [];
    let xLabel = 'Time (s)',
      yLabel = '',
      warning = '';
    const add = (name, value, unit) => {
      if (!Number.isFinite(value)) throw new Error('Result exceeds numerical limits.');
      values.push({ name, value, unit });
    };
    if (kind === 'projectile') {
      const theta = (p.angle * Math.PI) / 180,
        vx = p.speed * Math.cos(theta),
        vy = p.speed * Math.sin(theta);
      const flight = (vy + Math.sqrt(vy * vy + 2 * p.gravity * p.height)) / p.gravity;
      add('Flight time', flight, 's');
      add('Range', vx * flight, 'm');
      add('Peak height', p.height + (vy * vy) / (2 * p.gravity), 'm');
      for (let i = 0; i <= 240; i++) {
        const t = (flight * i) / 240;
        points.push({ x: vx * t, y: Math.max(0, p.height + vy * t - 0.5 * p.gravity * t * t), t });
      }
      xLabel = 'Distance (m)';
      yLabel = 'Height (m)';
    } else if (kind === 'spring') {
      const omega = Math.sqrt(p.stiffness / p.mass);
      add('Angular frequency', omega, 'rad/s');
      add('Period', (2 * Math.PI) / omega, 's');
      add('Total energy', 0.5 * p.stiffness * p.amplitude ** 2, 'J');
      for (let i = 0; i <= 240; i++) {
        const t = (p.duration * i) / 240;
        points.push({ x: t, y: p.amplitude * Math.cos(omega * t), t });
      }
      yLabel = 'Displacement (m)';
      if ((p.duration * omega) / (2 * Math.PI) > 40)
        warning =
          'Plot sampling is too coarse for this many cycles. Reduce the time window to resolve the oscillations.';
    } else if (kind === 'rc') {
      const tau = p.resistance * p.capacitance;
      add('Time constant', tau, 's');
      add('Initial current', p.voltage / p.resistance, 'A');
      add('Final stored energy', 0.5 * p.capacitance * p.voltage ** 2, 'J');
      for (let i = 0; i <= 240; i++) {
        const t = (5 * tau * i) / 240;
        points.push({ x: t, y: p.voltage * -Math.expm1(-t / tau), t });
      }
      yLabel = 'Capacitor voltage (V)';
    } else if (kind === 'beam') {
      const deflection = (p.force * p.length ** 3) / (3 * p.modulus * p.inertia);
      add('Tip deflection', deflection, 'm');
      add('Maximum bending stress', (p.force * p.length * p.outerFiber) / p.inertia, 'Pa');
      if (deflection / p.length > 0.05)
        warning =
          'Deflection exceeds 5% of beam length. The small-deflection model may not be valid.';
    } else if (kind === 'ohm') {
      add('Current', p.voltage / p.resistance, 'A');
      add('Power', p.voltage ** 2 / p.resistance, 'W');
    } else if (kind === 'force') add('Net force', p.mass * p.acceleration, 'N');
    else if (kind === 'kinetic') add('Kinetic energy', 0.5 * p.mass * p.speed ** 2, 'J');
    else if (kind === 'thermal')
      add('Heat transfer', p.mass * p.specificHeat * p.deltaTemperature, 'J');
    if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)))
      throw new Error('Plot exceeds numerical limits.');
    return {
      kind,
      title: spec.title,
      formula: spec.formula,
      assumptions: spec.assumptions,
      inputs: p,
      values,
      points,
      xLabel,
      yLabel,
      warning,
    };
  }
  const units = {
    m: ['length', 1],
    cm: ['length', 0.01],
    mm: ['length', 0.001],
    km: ['length', 1000],
    in: ['length', 0.0254],
    ft: ['length', 0.3048],
    kg: ['mass', 1],
    g: ['mass', 0.001],
    lb: ['mass', 0.45359237],
    s: ['time', 1],
    ms: ['time', 0.001],
    min: ['time', 60],
    h: ['time', 3600],
    N: ['force', 1],
    kN: ['force', 1000],
    lbf: ['force', 4.4482216152605],
    Pa: ['pressure', 1],
    kPa: ['pressure', 1000],
    MPa: ['pressure', 1e6],
    GPa: ['pressure', 1e9],
    psi: ['pressure', 6894.757293168],
    J: ['energy', 1],
    kJ: ['energy', 1000],
    Wh: ['energy', 3600],
    W: ['power', 1],
    kW: ['power', 1000],
    hp: ['power', 745.6998715822702],
    K: ['temperature', 1, 0],
    C: ['temperature', 1, 273.15],
    F: ['temperature', 5 / 9, 255.3722222222222],
  };
  function convert(value, from, to) {
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw new Error('Enter a finite number.');
    if (!Object.hasOwn(units, from) || !Object.hasOwn(units, to) || units[from][0] !== units[to][0])
      throw new Error('Choose compatible unit dimensions.');
    const a = units[from],
      b = units[to],
      si = value * a[1] + (a[2] || 0);
    if (a[0] === 'temperature' && si < -1e-10)
      throw new Error('Temperature is below absolute zero.');
    const result = (si - (b[2] || 0)) / b[1];
    if (!Number.isFinite(result)) throw new Error('Conversion exceeds numerical limits.');
    return result;
  }
  return { specs, calculate, convert, units };
});

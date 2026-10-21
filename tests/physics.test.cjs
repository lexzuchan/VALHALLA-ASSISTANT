const { test } = require('node:test'),
  assert = require('node:assert/strict');
const { calculate, convert, specs } = require('../ui/physics');
const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${actual} ≠ ${expected}`,
  );
test('projectile agrees with closed-form range and lands at ground level', () => {
  const r = calculate('projectile', { speed: 20, angle: 45, height: 0, gravity: 10 });
  near(r.values[0].value, 2 * Math.sqrt(2));
  near(r.values[1].value, 40);
  near(r.values[2].value, 10);
  near(r.points.at(-1).y, 0);
  assert.equal(r.points.length, 241);
});
test('vertical drop and elevated trajectories have correct flight times', () => {
  const r = calculate('projectile', { speed: 0, angle: 0, height: 20, gravity: 10 });
  near(r.values[0].value, 2);
  near(r.values[1].value, 0);
});
test('oscillator conserves analytic energy', () => {
  const r = calculate('spring', { mass: 2, stiffness: 8, amplitude: 3, duration: 5 });
  near(r.values[0].value, 2);
  near(r.values[1].value, Math.PI);
  near(r.values[2].value, 36);
  near(r.points[0].y, 3);
});
test('RC at one time constant reaches 1 - 1/e of supply', () => {
  const r = calculate('rc', { voltage: 10, resistance: 1000, capacitance: 0.001 });
  near(r.values[0].value, 1);
  near(r.points[48].y, 10 * (1 - Math.exp(-1)));
  near(r.values[2].value, 0.05);
});
test('cantilever uses second moment of area and warns for large deflection', () => {
  const r = calculate('beam', {
    force: 3,
    length: 2,
    modulus: 1000,
    inertia: 0.01,
    outerFiber: 0.1,
  });
  near(r.values[0].value, 0.8);
  near(r.values[1].value, 60);
  assert.ok(r.warning);
});
test('mechanics, circuit and heat results carry correct quantities', () => {
  near(calculate('force', { mass: 4, acceleration: -3 }).values[0].value, -12);
  near(calculate('kinetic', { mass: 4, speed: 3 }).values[0].value, 18);
  const ohm = calculate('ohm', { voltage: 12, resistance: 6 });
  near(ohm.values[0].value, 2);
  near(ohm.values[1].value, 24);
  near(
    calculate('thermal', { mass: 2, specificHeat: 1000, deltaTemperature: -3 }).values[0].value,
    -6000,
  );
});
test('invalid model inputs are rejected, including nonfinite and unexpected fields', () => {
  for (const value of [NaN, Infinity, -1, '1'])
    assert.throws(() =>
      calculate('spring', { mass: value, stiffness: 40, amplitude: 0.1, duration: 1 }),
    );
  assert.throws(() => calculate('__proto__', {}));
  assert.throws(() => calculate('force', { mass: 1, acceleration: 2, code: 'anything' }));
  assert.throws(() => calculate('ohm', { voltage: 12, resistance: 0 }));
});
test('dimensional conversions and absolute temperatures', () => {
  near(convert(1, 'in', 'mm'), 25.4);
  near(convert(1, 'lb', 'kg'), 0.45359237);
  near(convert(32, 'F', 'C'), 0);
  near(convert(100, 'C', 'F'), 212);
  near(convert(1, 'Wh', 'J'), 3600);
  assert.throws(() => convert(1, 'kg', 'm'));
  assert.throws(() => convert(-1, 'K', 'C'));
  assert.throws(() => convert(Infinity, 'm', 'cm'));
});
test('all default models produce finite values', () => {
  for (const [kind, spec] of Object.entries(specs)) {
    const result = calculate(kind, Object.fromEntries(spec.fields.map((f) => [f[0], f[3]])));
    assert.ok(result.values.every((v) => Number.isFinite(v.value)));
  }
});

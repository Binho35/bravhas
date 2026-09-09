import assert from "node:assert/strict";
import test from "node:test";

import { cpfDuplicateCandidates, isValidCpf, normalizeCpf, requireValidCpf } from "../../modules/hrdp/domain/cpf";
import { ACTIVE_EMPLOYEE_STATUSES, employeeEligibilityStateWhere, isOperationallyEligibleEmployee } from "../../modules/hrdp/workflows/employeeEligibility";

test("CPF normalizes a valid punctuated value to canonical digits", () => {
  assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
  assert.equal(requireValidCpf("529.982.247-25"), "52998224725");
});

test("CPF rejects invalid length, repeated digits and invalid check digits", () => {
  assert.equal(isValidCpf("123"), false);
  assert.equal(isValidCpf("00000000000"), false);
  assert.equal(isValidCpf("52998224724"), false);
  assert.throws(() => requireValidCpf("111.111.111-11"), /CPF inválido/);
});

test("CPF duplicate candidates cover canonical and legacy punctuated values", () => {
  assert.deepEqual(cpfDuplicateCandidates("529.982.247-25"), ["52998224725", "529.982.247-25"]);
});

test("operational eligibility rejects PRE_ADMISSION and inactive records", () => {
  assert.equal(isOperationallyEligibleEmployee({ active: true, status: "PRE_ADMISSION" }), false);
  assert.equal(isOperationallyEligibleEmployee({ active: false, status: "ACTIVE" }), false);
  assert.equal(isOperationallyEligibleEmployee({ active: true, status: "ACTIVE" }), true);
  assert.equal(isOperationallyEligibleEmployee({ active: true, status: "ON_LEAVE" }), true);
  assert.equal(isOperationallyEligibleEmployee({ active: true, status: "TERMINATED" }), false);
});

test("active-only state helper preserves vacations policy while centralizing eligibility", () => {
  assert.deepEqual(employeeEligibilityStateWhere(ACTIVE_EMPLOYEE_STATUSES), {
    active: true,
    status: { in: ["ACTIVE"] },
  });
});

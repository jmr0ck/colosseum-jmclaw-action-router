export function evaluatePolicy(opts) {
    const { policy, touchedProgramIds } = opts;
    const reasons = [];
    if (policy.requireApproval) {
        reasons.push('requireApproval=true (report-only)');
    }
    if (policy.denyPrograms?.length) {
        const denied = touchedProgramIds.filter((p) => policy.denyPrograms.includes(p));
        if (denied.length)
            reasons.push(`denied program(s) hit: ${denied.join(', ')}`);
    }
    if (policy.allowPrograms?.length) {
        const notAllowed = touchedProgramIds.filter((p) => !policy.allowPrograms.includes(p));
        if (notAllowed.length)
            reasons.push(`program(s) not in allowlist: ${notAllowed.join(', ')}`);
    }
    const passed = reasons.length === 0;
    return { passed, reasons };
}

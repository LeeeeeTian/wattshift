// Times are half-hour slots from midnight. Rates are fen per kWh.
const WattShift = (() => {
  const rates = Array.from({length: 48}, (_, i) =>
    i < 16 || i >= 44 ? 32 : (i >= 22 && i < 26) || i >= 36 ? 102 : 62);
  const sample = [
    {name: '电动车充电', watts: 3300, length: 4, from: 36, until: 48},
    {name: '烘干机', watts: 2000, length: 2, from: 36, until: 48},
    {name: '洗碗机', watts: 1200, length: 3, from: 34, until: 48}
  ];
  function solve(jobs, cheapest = true) {
    const full = (1 << jobs.length) - 1;
    const memo = new Map();
    function visit(slot, done) {
      if (done === full) return {score: 0, runs: []};
      if (slot === 48) return null;
      const key = slot * (full + 1) + done;
      if (memo.has(key)) return memo.get(key);
      let best = null;
      for (const [id, job] of jobs.entries()) {
        const bit = 1 << id;
        const end = slot + job.length;
        if ((done & bit) || slot < job.from || end > job.until) continue;
        const tail = visit(end, done | bit);
        if (!tail) continue;
        const cost = job.watts * rates.slice(slot, end).reduce((a,b) => a+b, 0);
        const score = cost + tail.score;
        if (!best || score < best.score) best = {score, runs: [{id, slot, end}, ...tail.runs]};
        if (!cheapest) break;
      }
      if (!best || cheapest) {
        const idle = visit(slot + 1, done);
        if (idle && (!best || idle.score < best.score)) best = idle;
      }
      memo.set(key, best);
      return best;
    }
    const result = visit(0, 0);
    return result && {yuan: result.score / 200000, runs: result.runs};
  }
  const time = slot => String(Math.floor(slot / 2)).padStart(2, '0') + (slot % 2 ? ':30' : ':00');
  return {rates, sample, solve, time};
})();
if (typeof module !== 'undefined') module.exports = WattShift;

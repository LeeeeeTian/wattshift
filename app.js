const {sample, rates, solve, time} = WattShift;
const jobs = sample.map(job => ({...job}));
const $ = id => document.getElementById(id);
const colors = ['#a69aef','#ffaf79','#87d9c1'];
for (let hour = 0; hour < 24; hour++) {
  const bar = document.createElement('i');
  const rate = rates[hour * 2];
  bar.style.height = (rate / 110 * 100) + '%';
  bar.style.setProperty('--bar', rate === 32 ? colors[2] : rate === 62 ? colors[0] : colors[1]);
  bar.title = time(hour * 2) + ' · ¥' + (rate / 100).toFixed(2) + '/kWh';
  $('chart').append(bar);
}
function readHour() {
  const hour = Number($('hour').value);
  const rate = rates[hour * 2];
  const tier = rate === 32 ? '谷价' : rate === 62 ? '平价' : '峰价';
  $('ghost').style.left = ((hour + 0.5) / 24 * 100) + '%';
  $('reading').textContent = time(hour * 2) + ' · ' + tier + ' ¥' + (rate / 100).toFixed(2) + '/kWh';
  $('hour').setAttribute('aria-valuetext', $('reading').textContent);
}
$('hour').oninput = readHour;
readHour();
function field(job, key, title, values, format) {
  const label = document.createElement('label');
  label.textContent = title;
  const select = document.createElement('select');
  select.setAttribute('aria-label', job.name + ' · ' + title);
  for (const value of values) select.add(new Option(format(value), value));
  select.value = job[key];
  select.onchange = () => { job[key] = Number(select.value); renderPlan(); };
  label.append(select);
  return label;
}
function renderInputs() {
  $('jobs').replaceChildren();
  const slots = Array.from({length:48}, (_, i) => i);
  for (const [id, job] of jobs.entries()) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.setProperty('--color', colors[id]);
    const name = document.createElement('strong');
    name.textContent = job.name;
    row.append(name, field(job,'watts','功率',[500,1000,1200,1500,2000,3300,7000],w => w/1000+' kW'),
      field(job,'length','运行时长',[1,2,3,4,5,6,8],n => n/2+' 小时'),
      field(job,'from','最早启动',slots,time),
      field(job,'until','最晚完成',slots.map(n => n+1),time));
    $('jobs').append(row);
  }
}
function drawTrack(label, plan) {
  const track = document.createElement('div');
  track.className = 'track';
  track.append(label);
  const rail = document.createElement('div');
  rail.className = 'rail';
  const entries = [];
  for (const run of plan.runs) {
    const block = document.createElement('i');
    block.className = 'block';
    block.style.background = colors[run.id];
    block.style.left = (run.slot/48*100)+'%';
    block.style.width = ((run.end-run.slot)/48*100)+'%';
    block.title = jobs[run.id].name+' '+time(run.slot)+'–'+time(run.end);
    entries.push(block.title);
    rail.append(block);
  }
  rail.setAttribute('role','img');
  rail.setAttribute('aria-label',entries.join('，'));
  track.append(rail);
  $('tracks').append(track);
}
function renderPlan() {
  const early = solve(jobs, false);
  const best = solve(jobs);
  $('tracks').replaceChildren();
  $('energy').textContent = Number((jobs.reduce((n,j)=>n+j.watts*j.length/2000,0)).toFixed(2))+' kWh';
  if (!best) {
    $('saving').textContent = $('opt').textContent = $('base').textContent = '—';
    $('percent').textContent = '当前时间窗口有冲突';
    $('schedule').textContent = '请提前最早启动时间、推迟最晚完成时间，或缩短运行时长。';
    return;
  }
  drawTrack('尽早启动',early);
  drawTrack('错峰运行',best);
  const money = n => '¥'+n.toFixed(2);
  const saved = early.yuan-best.yuan;
  $('saving').textContent = money(saved);
  $('base').textContent = money(early.yuan);
  $('opt').textContent = money(best.yuan);
  $('percent').textContent = '比尽早启动节省 '+(saved/early.yuan*100).toFixed(1)+'%';
  $('schedule').textContent = best.runs.map(r => time(r.slot)+'–'+time(r.end)+'  '+jobs[r.id].name).join('　 /　');
}
$('reset').onclick = () => {
  $('hour').value = 18;
  readHour();
  jobs.splice(0,jobs.length,...sample.map(j => ({...j})));
  renderInputs();
  renderPlan();
};
renderInputs();
renderPlan();

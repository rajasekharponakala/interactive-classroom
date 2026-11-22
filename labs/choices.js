// Shared non-drag controls. Native selects work with touch, keyboard and assistive tech.
window.LabChoices = function (root, config) {
  const make = (tag, text) => Object.assign(document.createElement(tag), {textContent:text});
  const field = (label, choices) => {
    const wrap = make('label', label + ' '), select = make('select', '');
    select.add(new Option('Choose…', ''));
    choices.forEach(([value, name]) => select.add(new Option(name, value)));
    wrap.append(select); root.append(wrap);
    return select;
  };
  root.replaceChildren();
  root.classList.add('lab-choices');
  const source = field(config.sourceLabel, config.sources);
  const target = config.targets ? field(config.targetLabel, config.targets) : null;
  const actions = make('div',''), status = make('p','');
  actions.className = 'row'; status.className = 'note'; status.setAttribute('role','status');
  function action(text, onClick) {
    const b = make('button', text); b.type = 'button'; b.className = 'btn'; b.onclick = onClick; actions.append(b);
  }
  action(config.action || 'Place', () => {
    if (!source.value || (target && !target.value)) { status.textContent = target ? 'Make both choices first.' : 'Choose a piece first.'; if (!source.value) source.focus(); else target.focus(); return; }
    status.textContent = config.place(source.value, target?.value);
  });
  if (config.undo) action('Undo last', () => { status.textContent = config.undo(); });
  action('Start over', () => { config.reset(); source.value = ''; if (target) target.value = ''; status.textContent = 'Ready to start again.'; source.focus(); });
  root.append(actions,status);
  return message => { status.textContent = message; };
};

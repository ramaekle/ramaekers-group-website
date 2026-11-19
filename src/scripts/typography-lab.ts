import { availableWeight } from '../data/typography-lab';

const lab = document.querySelector<HTMLElement>('#typography-lab');
if (lab) {
  const select = (id: string) => lab.querySelector<HTMLSelectElement>(`#${id}`)!;
  const compare = lab.querySelector<HTMLInputElement>('#compare-mode')!;
  const tracking = lab.querySelector<HTMLInputElement>('#heading-tracking')!;
  const form = lab.querySelector<HTMLFormElement>('#lab-controls')!;
  const revisions = { a: 0, b: 0 };
  const sampleText = 'Strategy Must Produce Profit. Operating Margin: 18.4%';

  async function renderPair(id: 'a' | 'b') {
    const revision = ++revisions[id];
    const panel = lab!.querySelector<HTMLElement>(`[data-panel='${id}']`)!;
    const content = panel.querySelector<HTMLElement>('[data-preview-content]')!;
    const status = panel.querySelector<HTMLElement>('[data-font-status]')!;
    const specimen = panel.querySelector<HTMLElement>('.lab-specimen')!;
    const heading = select(`heading-${id}`).value;
    const body = select(`body-${id}`).value;
    const requested = Number(select('heading-weight').value);
    const weight = availableWeight(heading, requested);
    const semibold = availableWeight(body, 600);
    panel.dataset.theme = select('preview-theme').value;
    panel.querySelector<HTMLElement>('[data-pairing-description]')!.textContent = `${heading} headings / ${body} body`;
    content.hidden = true;
    panel.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading selected fonts…';
    try {
      const requests = [[heading, weight], [body, 400], [body, semibold], [body, 700]] as const;
      await Promise.all(requests.map(async ([family, fontWeight]) => {
        const faces = await document.fonts.load(`${fontWeight} 17px "${family}"`, sampleText);
        if (!faces.length || faces.some(face => face.status !== 'loaded')) throw new Error(`Could not load ${family}`);
      }));
      if (revisions[id] !== revision) return;
      specimen.style.setProperty('--lab-heading-font', `"${heading}"`);
      specimen.style.setProperty('--lab-body-font', `"${body}"`);
      specimen.style.setProperty('--lab-heading-weight', String(weight));
      specimen.style.setProperty('--lab-body-semibold', String(semibold));
      specimen.style.setProperty('--lab-body-size', `${select('body-size').value}px`);
      specimen.style.setProperty('--lab-tracking', `${tracking.value}em`);
      const mapping = weight === requested ? `Headings ${weight}` : `Headings: requested ${requested}, available ${weight}`;
      status.textContent = `Fonts loaded · ${mapping} · Body ${select('body-size').value}px`;
      content.hidden = false;
      panel.dataset.fontState = 'loaded';
    } catch {
      if (revisions[id] !== revision) return;
      status.textContent = 'Font loading failed. The specimen is hidden to avoid a misleading fallback. Check the font files and change a selector to retry.';
      panel.dataset.fontState = 'error';
    } finally {
      if (revisions[id] === revision) panel.removeAttribute('aria-busy');
    }
  }

  function update() {
    lab!.querySelector<HTMLElement>('#controls-b')!.hidden = !compare.checked;
    lab!.querySelector<HTMLElement>('[data-panel="b"]')!.hidden = !compare.checked;
    lab!.querySelector<HTMLElement>('#lab-comparisons')!.dataset.compare = String(compare.checked);
    lab!.querySelector<HTMLOutputElement>('#tracking-value')!.value = `${Number(tracking.value).toFixed(3)}em`;
    void renderPair('a');
    if (compare.checked) void renderPair('b');
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  lab.querySelector('#lab-reset')!.addEventListener('click', () => {
    form.reset();
    update();
  });
  lab.querySelectorAll<HTMLButtonElement>('[data-sample-action]').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.lab-form-sample')!.querySelector('[data-action-feedback]')!.textContent = 'Sample action activated. No information was sent or saved.';
    });
  });
  update();
}

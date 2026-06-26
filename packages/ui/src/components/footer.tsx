/* @refresh reload */
import { Component } from 'solid-js';
import { noShadowDOM } from 'component-register';

const Footer: Component = () => {
  noShadowDOM();

  return (
    <div class="ui-bg-black ui-text-white ui-flex ui-justify-center">
      <p class="typo-u5 ui-w-full ui-max-w-screen-xl ui-m-6 md:ui-m-8 ui-text-center ui-text-white/80">
        © 2026 กรุงเทพมหานคร | พัฒนาต่อยอดจากโครงการ{' '}
        <a href="https://bkkelection2022.wevis.info/" target="_blank" rel="noreferrer" class="ui-underline">
          Bangkok Election 2022
        </a>{' '}
        โดย WeVis ภายใต้สัญญาอนุญาต CC BY-NC-SA 4.0{' '}
        <button
          type="button"
          data-analytics-consent-settings
          class="ui-underline ui-text-white/80"
        >
          ตั้งค่าคุกกี้
        </button>
      </p>
    </div>
  );
};

export default Footer;

export class NotificationCenter {
  constructor(container) {
    this.container = container;
    this.maxVisible = 5;
  }

  push({ kind = 'warn', message }) {
    if (!message) {
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.innerHTML = `<span>${message}</span>`;
    this.container.appendChild(toast);

    while (this.container.children.length > this.maxVisible) {
      this.container.firstElementChild?.remove();
    }

    requestAnimationFrame(() => toast.classList.add('visible'));
    window.setTimeout(() => {
      toast.classList.remove('visible');
      window.setTimeout(() => toast.remove(), 220);
    }, 3600);
  }
}


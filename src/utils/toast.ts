type ToastType = 'success' | 'error' | 'warning' | 'info';

class ToastManager {
  private container: HTMLDivElement | null = null;

  private createContainer(): HTMLDivElement {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(this.container);
    return this.container;
  }

  show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    const container = this.createContainer();
    const toast = document.createElement('div');
    
    const bgColors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    toast.className = `${bgColors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right`;
    toast.innerHTML = `
      <span>${this.getIcon(type)}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-slide-out-right');
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
          container.remove();
          this.container = null;
        }
      }, 300);
    }, duration);
  }

  private getIcon(type: ToastType): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type];
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration || 5000);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}

export const toast = new ToastManager();

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import BaseButton from '@/components/ui/BaseButton.vue';

describe('BaseButton.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click Me' }
    });
    expect(wrapper.text()).toContain('Click Me');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('applies primary classes by default', () => {
    const wrapper = mount(BaseButton);
    expect(wrapper.classes()).toContain('bg-blue-600');
  });

  it('applies danger classes when variant is danger', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'danger' }
    });
    expect(wrapper.classes()).toContain('bg-red-600');
  });

  it('applies secondary classes when variant is secondary', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'secondary' }
    });
    expect(wrapper.classes()).toContain('bg-gray-200');
  });
});

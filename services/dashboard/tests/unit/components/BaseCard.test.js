import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import BaseCard from '@/components/ui/BaseCard.vue';

describe('BaseCard.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(BaseCard, {
      slots: { default: '<div class="test-content">Card Content</div>' }
    });
    expect(wrapper.html()).toContain('test-content');
    expect(wrapper.text()).toContain('Card Content');
  });

  it('applies base card styles', () => {
    const wrapper = mount(BaseCard);
    expect(wrapper.classes()).toContain('bg-white');
    expect(wrapper.classes()).toContain('rounded-lg');
    expect(wrapper.classes()).toContain('shadow');
  });
});

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MetricBadge from '@/components/ui/MetricBadge.vue';

describe('MetricBadge.vue', () => {
  it('renders label and value', () => {
    const wrapper = mount(MetricBadge, {
      props: { label: 'Temperature', value: 42 }
    });
    expect(wrapper.text()).toContain('Temperature');
    expect(wrapper.text()).toContain('42');
  });

  it('renders unit if provided', () => {
    const wrapper = mount(MetricBadge, {
      props: { label: 'Temp', value: 42, unit: '°C' }
    });
    expect(wrapper.text()).toContain('°C');
  });

  it('does not render unit if not provided', () => {
    const wrapper = mount(MetricBadge, {
      props: { label: 'Count', value: 10 }
    });
    // the span for unit shouldn't exist, meaning the text is just label + value
    const text = wrapper.text();
    expect(text).not.toContain('°C');
  });

  it('renders sub label if provided', () => {
    const wrapper = mount(MetricBadge, {
      props: { label: 'Temp', value: 42, sub: 'Updated just now' }
    });
    expect(wrapper.text()).toContain('Updated just now');
  });

  it('applies correct variant class based on prop', () => {
    const variants = {
      default: 'text-ink',
      critical: 'text-critical',
      warning: 'text-warning',
      normal: 'text-normal',
      accent: 'text-accent'
    };

    for (const [variant, expectedClass] of Object.entries(variants)) {
      const wrapper = mount(MetricBadge, {
        props: { label: 'Test', value: 1, variant }
      });
      const valueSpan = wrapper.find('.font-mono.text-2xl');
      expect(valueSpan.classes()).toContain(expectedClass);
    }
  });
});

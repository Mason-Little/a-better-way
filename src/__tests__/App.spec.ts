import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import App from '../App.vue'

describe('App', () => {
  it('mounts properly', () => {
    const wrapper = mount(App, {
      global: {
        stubs: ['RouterView'],
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})

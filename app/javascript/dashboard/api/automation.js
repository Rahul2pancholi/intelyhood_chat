/* global axios */
import ApiClient from './ApiClient';

class AutomationsAPI extends ApiClient {
  constructor() {
    super('automation_rules', { accountScoped: true });
  }

  clone(automationId) {
    return axios.post(`${this.url}/${automationId}/clone`);
  }

  run(automationId) {
    return axios.post(`${this.url}/${automationId}/run`);
  }
}

export default new AutomationsAPI();

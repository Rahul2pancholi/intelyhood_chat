/* global axios */
import ApiClient from './ApiClient';

class BillingAPI extends ApiClient {
  constructor() {
    super('billing', { accountScoped: true });
  }

  get() {
    return axios.get(this.url);
  }

  createCheckoutSession(planId) {
    return axios.post(`${this.url}/checkout_session`, { plan_id: planId });
  }

  createPortalSession() {
    return axios.post(`${this.url}/portal_session`);
  }
}

export default new BillingAPI();

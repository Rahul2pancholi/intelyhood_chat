import axios from 'axios';

const { apiHost = '' } = window.intelychatConfig || {};
const wootAPI = axios.create({ baseURL: `${apiHost}/` });

export default wootAPI;

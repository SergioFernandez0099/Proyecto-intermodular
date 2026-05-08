import {isInProduction} from "./production";

export const SERVER_BASE = (isInProduction) ?
  'https://tfg.sergiof.es' : 'http://localhost:8000';
export const API_BASE = `${SERVER_BASE}/api`;

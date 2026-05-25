
// Ponto de entrada modular. Importa os módulos e expõe as funções necessárias
import * as constants from './src/constants.js';
import * as auth from './src/auth.js';
import * as evaluator from './src/evaluator.js';
import * as dashboard from './src/dashboard.js';

// Expõe no escopo global (window) as funções usadas por handlers inline nos HTMLs
window.ATENDENTES = constants.ATENDENTES;
window.initAvaliador = evaluator.initAvaliador;
window.selectRating = evaluator.selectRating;
window.renderSubgroupOptions = evaluator.renderSubgroupOptions;
window.toggleSubgroup = evaluator.toggleSubgroup;
window.validateAvaliador = evaluator.validateAvaliador;
window.checkSubmit = evaluator.checkSubmit;
window.submitRating = evaluator.submitRating;

window.initProgramador = dashboard.initProgramador;
window.switchTab = dashboard.switchTab;
window.switchDashView = dashboard.switchDashView;
window.updateDashboard = dashboard.updateDashboard;
window.buildAttChips = dashboard.buildAttChips;
window.showAttendantDetails = dashboard.showAttendantDetails;
window.renderPreview = dashboard.renderPreview;
window.exportCSV = dashboard.exportCSV;
window.exportJSON = dashboard.exportJSON;

window.openPwdModal = auth.openPwdModal;
window.closePwdModal = auth.closePwdModal;
window.togglePwd = auth.togglePwd;
window.confirmPwd = auth.confirmPwd;
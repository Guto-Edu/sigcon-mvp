(function () {
  const KEY = 'sigcon_obras_data_v2';
  const USER_KEY = 'sigcon_obras_user_v2';

  const StorageService = {
    key: KEY,
    load() {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const seed = Utils.copyDeep(window.SIGCON_INITIAL_DATA);
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
      }
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Dados corrompidos no LocalStorage. Recriando base inicial.', err);
        const seed = Utils.copyDeep(window.SIGCON_INITIAL_DATA);
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
      }
    },
    save(data) {
      localStorage.setItem(KEY, JSON.stringify(data));
    },
    reset() {
      const seed = Utils.copyDeep(window.SIGCON_INITIAL_DATA);
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    },
    getCurrentUserId() {
      return localStorage.getItem(USER_KEY) || 'u-admin';
    },
    setCurrentUserId(id) {
      localStorage.setItem(USER_KEY, id);
    },
    exportJSON(data) {
      Utils.download(`sigcon-obras-dados-${Utils.todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    }
  };

  window.StorageService = StorageService;
})();

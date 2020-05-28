export const getUserData = (key) =>
  window.localStorage.getItem(["sg.userdata", key].join("."));

export const setUserData = (key, value) =>
  window.localStorage.setItem(["sg.userdata", key].join("."), value);

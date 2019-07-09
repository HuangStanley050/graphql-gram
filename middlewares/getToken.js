export const getToken = req => {
  let token;
  if (!req) {
    throw new Error("No Auth in header");
  }
  token = req.split(" ")[1];
  return token;
};

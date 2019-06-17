import jwt from "jsonwebtoken";
const secretToken = process.env.SECRET;
const checkAuth = token => {
  if (!token || token === "") {
    throw new Error("No token attached!");
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, secretToken);
  } catch (error) {
    throw new Error("token decode failed!!");
  }
  if (!decodedToken) {
    throw new Error("Unable to authenticat with token");
  }
  return decodedToken;
};

export {checkAuth};

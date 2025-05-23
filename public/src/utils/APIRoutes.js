// export const host = "http://localhost:5001";
// đổi thành địa chỉ IP của máy chủ
export const host = process.env.REACT_APP_SERVER_URL;
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;

export const createChannelRoute = `${host}/api/channels/create`;
export const getUserChannelsRoute = `${host}/api/channels/user`;
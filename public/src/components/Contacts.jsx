// import React, { useState, useEffect } from "react";
// import styled from "styled-components";
// import Logo from "../assets/logo.svg";

// export default function Contacts({ contacts, changeChat }) {
//   const [currentUserName, setCurrentUserName] = useState(undefined);
//   const [currentUserImage, setCurrentUserImage] = useState(undefined);
//   const [currentSelected, setCurrentSelected] = useState(undefined);
//   useEffect(async () => {
//     const data = await JSON.parse(
//       localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
//     );
//     setCurrentUserName(data.username);
//     setCurrentUserImage(data.avatarImage);
//   }, []);
//   const changeCurrentChat = (index, contact) => {
//     setCurrentSelected(index);
//     changeChat(contact);
//   };
//   return (
//     <>
//       {currentUserImage && currentUserImage && (
//         <Container>
//           <div className="brand">
//             <img src={Logo} alt="logo" />
//             <h3>mmt</h3>
//           </div>
//           {/* <div>hi</div> */}
//           <div className="contacts">
//             {contacts.map((contact, index) => {
//               return (
//                 <div
//                   key={contact._id}
//                   className={`contact ${
//                     index === currentSelected ? "selected" : ""
//                   }`}
//                   onClick={() => changeCurrentChat(index, contact)}
//                 >
//                   <div className="avatar">
//                     <img
//                       src={`data:image/svg+xml;base64,${contact.avatarImage}`}
//                       alt=""
//                     />
//                   </div>
//                   <div className="username">
//                     <h3>{contact.username}</h3>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="current-user">
//             <div className="avatar">
//               <img
//                 src={`data:image/svg+xml;base64,${currentUserImage}`}
//                 alt="avatar"
//               />
//             </div>
//             <div className="username">
//               <h2>{currentUserName}</h2>
//             </div>
//           </div>
//         </Container>
//       )}
//     </>
//   );
// }
// const Container = styled.div`
//   display: grid;
//   grid-template-rows: 10% 75% 15%;
//   overflow: hidden;
//   background-color: #ffffff;
//   border-right: 1px solid #e5e7eb;

//   .brand {
//     display: flex;
//     align-items: center;
//     gap: 1rem;
//     justify-content: center;
//     padding: 1rem 0;
//     border-bottom: 1px solid #e5e7eb;

//     img {
//       height: 2rem;
//     }

//     h3 {
//       color: #1f2937;
//       text-transform: uppercase;
//       font-weight: 600;
//     }
//   }

//   .contacts {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     overflow-y: auto;
//     gap: 0.75rem;
//     padding: 1rem;

//     &::-webkit-scrollbar {
//       width: 0.4rem;
//     }

//     &::-webkit-scrollbar-thumb {
//       background-color: #cbd5e1;
//       border-radius: 1rem;
//     }

//     .contact {
//       background-color: #f9fafb;
//       min-height: 4.5rem;
//       cursor: pointer;
//       width: 100%;
//       border-radius: 0.5rem;
//       padding: 0.5rem 1rem;
//       display: flex;
//       gap: 1rem;
//       align-items: center;
//       transition: background-color 0.3s ease-in-out;
//       box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

//       .avatar {
//         img {
//           height: 3rem;
//           border-radius: 50%;
//         }
//       }

//       .username {
//         h3 {
//           color: #1f2937;
//           font-size: 1rem;
//           font-weight: 500;
//         }
//       }

//       &:hover {
//         background-color: #e2e8f0;
//       }
//     }

//     .selected {
//       background-color: #c7d2fe;

//       .username h3 {
//         color: #4f46e5;
//         font-weight: 600;
//       }
//     }
//   }

//   .current-user {
//     background-color: #f1f5f9;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     gap: 1rem;
//     padding: 1rem;

//     .avatar {
//       img {
//         height: 3.5rem;
//         max-inline-size: 100%;
//         border-radius: 50%;
//       }
//     }

//     .username {
//       h2 {
//         color: #1f2937;
//         font-size: 1.2rem;
//         font-weight: 600;
//       }
//     }

//     @media screen and (min-width: 720px) and (max-width: 1080px) {
//       gap: 0.5rem;

//       .username {
//         h2 {
//           font-size: 1rem;
//         }
//       }
//     }
//   }
// `;

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";

export default function Contacts({ contacts, changeChat, onlineUsers }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      setCurrentUserName(data.username);
      setCurrentUserImage(data.avatarImage);
    };
    fetchUser();
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  return (
    <>
    {currentUserImage && currentUserImage && (
    <Container>
      <div className="brand">
        <img src={Logo} alt="logo" />
        <h3>mmt</h3>
      </div>
      <div className="contacts">
        {contacts.map((contact, index) => {
          const isOnline = onlineUsers?.has(contact._id);
          return (
            <div
              key={contact._id}
              className={`contact ${index === currentSelected ? "selected" : ""}`}
              onClick={() => changeCurrentChat(index, contact)}
            >
              <div className="avatar">
                <img
                  src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                  alt=""
                />
                <div className={`status-dot ${isOnline ? "online" : "offline"}`} />
              </div>
              <div className="username">
                <h3>{contact.username}</h3>
                <div className="status">
                  <span className={`status-dot ${isOnline ? "online" : "offline"}`}></span>
                  <span className="status-text">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="current-user">
        <div className="avatar">
          <img
            src={`data:image/svg+xml;base64,${currentUserImage}`}
            alt="avatar"
          />
        </div>
        <div className="username">
          <h2>{currentUserName}</h2>
        </div>
      </div>
    </Container>
    )}
  </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e7eb;

    img {
      height: 2rem;
    }

    h3 {
      color: #1f2937;
      text-transform: uppercase;
      font-weight: 600;
    }
  }

  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    gap: 0.75rem;
    padding: 1rem;

    &::-webkit-scrollbar {
      width: 0.4rem;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 1rem;
    }

    .contact {
      background-color: #f9fafb;
      min-height: 4.5rem;
      cursor: pointer;
      width: 100%;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: background-color 0.3s ease-in-out;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

      .avatar {
        img {
          height: 3rem;
          border-radius: 50%;
        }
      }

      .username {
        display: flex;
        flex-direction: column;

        h3 {
          color: #1f2937;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #6b7280;

          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;

            &.online {
              background-color: #22c55e; /* Green */
            }

            &.offline {
              background-color: #ef4444; /* Red */
            }
          }
        }
      }

      &:hover {
        background-color: #e2e8f0;
      }
    }

    .selected {
      background-color: #c7d2fe;

      .username h3 {
        color: #4f46e5;
        font-weight: 600;
      }
    }
  }

  .current-user {
    background-color: #f1f5f9;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1rem;

    .avatar {
      img {
        height: 3.5rem;
        max-inline-size: 100%;
        border-radius: 50%;
      }
    }

    .username {
      h2 {
        color: #1f2937;
        font-size: 1.2rem;
        font-weight: 600;
      }
    }

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;

      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;
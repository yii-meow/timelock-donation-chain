import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Style from "./NavBar.module.css";
import { ChatAppContext } from "../../ChatAppContext";
import images from "../../assets";

const NavBar = () => {
  const menuItems = [
    {
      menu: "ALL USERS",
      link: "/chat/allusers",
    },
    {
      menu: "CHAT",
      link: "/chat/chat",
    },
  ];

  const { userName } = useContext(ChatAppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isActiveLink = (link) => {
    if (location.pathname === "/chat" && link === "/chat/allusers") {
      return true; // Default to "All Users" when on the main chat page
    }
    return location.pathname === link;
  };

  const handleExitChat = () => {
    // Implement any logout logic here if needed
    navigate("/dashboard");
  };

  return (
    <div className={Style.NavBar}>
      <div className={Style.NavBar_box}>
        <div className={Style.NavBar_box_left}>
          <img src={images.logo} alt="logo" width={100} height={100} />
        </div>

        <div className={Style.NavBar_box_right}>
          <div className={Style.NavBar_box_right_menu}>
            {menuItems.map((el, i) => (
              <div
                key={i + 1}
                className={`${Style.NavBar_box_right_menu_items}
                ${isActiveLink(el.link) ? Style.active_btn : ""}
                      }`}
              >
                <Link
                  className={Style.NavBar_box_right_menu_items_link}
                  to={el.link}
                >
                  {el.menu}
                </Link>
              </div>
            ))}
          </div>

          <div className={Style.NavBar_box_right_connect}>
            <button>
              <img
                src={images.accountName}
                alt="Account"
                width={20}
                height={20}
              />
              <small>{userName}</small>
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleExitChat} className={Style.ExitChatButton}>
        EXIT CHAT
      </button>
    </div>
  );
};

export default NavBar;

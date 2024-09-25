import React, { useState, useEffect, useContext } from 'react'

// import { UserCard } from './chatappindex';
import Style from './styles/alluser.module.css';
import { ChatAppContext } from '../ChatAppContext';

const Alluser = () => {
    const { userLists, addFriends } = useContext(ChatAppContext);

    return (
        <div>
            <div className={Style.alluser_info}>
                <h1>Find Your Friends</h1>
            </div>

            <div className={Style.alluser}>
                {/* {userLists.map((el, i) => (
                    <UserCard key={i + 1} el={el} i={i} addFriends={addFriends} />
                ))} */}
            </div>
        </div>
    );
};

export default Alluser;

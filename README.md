# Initial Setup

## Truffle
Launch Ganache, and set up a workspace, add the file "truffle-config.js" as truffle project and start the project.

In terminal, go to the root path of this project, and type these commands:

<code>truffle compile</code>
<code>truffle migrate</code>

## React
<code>npm install</code>
<code>npm start</code>

## Edit env file
Save these variable in .env file at root path after launching command <codetruffle migrate</code>, and check for the contract addresses from the terminal screen or Ganache project

1. Put your AuthManager contract address from Ganache as REACT_APP_AUTH_MANAGER_ADDRESS
2. Put your ChatApp contract address from Ganache as REACT_APP_CHAT_ADDRESS
3. Put your CombinedTimeLock contract address from Ganache as REACT_APP_COMBINED_TIMELOCK_ADDRESS

E.g: in file (.env) at root
REACT_APP_AUTH_MANAGER_ADDRESS=0X.......
REACT_APP_CHAT_ADDRESS=0X.......
REACT_APP_COMBINED_TIMELOCK_ADDRESS=0X.......

# Side Notes
The first address of the Ganache will be the admin. 

By default, a donation transaction will need 1 approval, the first three Ganache addresses can be the approvals except the first one (admin), other addresses can be either donor or charity.

The first address in the Ganache network is the admin, admin can approve / disapprove charity.

A donor can donate instantly or as scheduled and check the donation history.

A charity can gain donations from the donors.

An admin can approve or disapprove a charity for accepting donations.

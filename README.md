# Initial Setup

## Truffle

<code>truffle compile</code>
<code>truffle migrate</code>

## React

<code>npm install</code>
<code>npm start</code>

## Edit env file

Save these variable in .env file at root path after truffle migrate, check for the contract addresses

1. Put your AuthManager contract address from Ganache as REACT_APP_AUTH_MANAGER_ADDRESS
2. Put your ChatApp contract address from Ganache as REACT_APP_CHAT_ADDRESS
3. Put your CombinedTimeLock contract address from Ganache as REACT_APP_COMBINED_TIMELOCK_ADDRESS

E.g: in file (.env) at root
REACT_APP_AUTH_MANAGER_ADDRESS=0X.......
REACT_APP_CHAT_ADDRESS=0X.......
REACT_APP_COMBINED_TIMELOCK_ADDRESS=0X.......

# Side Notes

By default, a transaction will need 2 approvals, all of the 10 addresses can be the approval.

The first address in the Ganache network is the admin, admin can approve / disapprove charity.

Users can donate, check donation history

import Modal from './Modal';
import '../styles/ListHeader.css';
import { useState } from 'react';
import { useCookies } from 'react-cookie';

function ListHeader({ listName, getData }) {
  const [showModal, setShowModal] = useState(false);
  const [cookies, setCookies, removeCookies] = useCookies([
    'Email',
    'AuthToken',
  ]);

  const logOut = () => {
    console.log('Logging out');
    removeCookies('Email', { path: '/' });
    removeCookies('AuthToken', { path: '/' });
    window.location.reload();
  };

  return (
    <div className='listHeader-container'>
      <h1 className='listHeader-title'>{listName}</h1>
      <div className='button-container'>
        <button className='create-button' onClick={() => setShowModal(true)}>
          New ToDo
        </button>
        <button className='logout-button' onClick={logOut}>
          Log Out
        </button>
      </div>
      {showModal && (
        <Modal mode={'create'} setShowModal={setShowModal} getData={getData} />
      )}
    </div>
  );
}

export default ListHeader;

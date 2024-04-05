import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import ListHeader from './components/ListHeader';
import ListItem from './components/ListItem';
import Auth from './components/Auth';
import './styles/App.css';
const serverUrl = import.meta.env.VITE_SERVER_URL;

function App() {
  const [cookies, setCookie, removeCookie] = useCookies(null);
  const authToken = cookies.AuthToken;
  const userEmail = cookies.Email;
  const [task, setTask] = useState([]);

  console.log('authToken', authToken);

  const getData = async () => {
    try {
      const response = await fetch(`${serverUrl}/todos`, {
        headers: {
          authorization: authToken,
        },
      });
      const json = await response.json();
      setTask(json);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (authToken) {
      getData();
    }
  }, []);

  console.log(task);

  const sortedTasks =
    Array.isArray(task) && task.length > 0
      ? [...task].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];

  return (
    <>
      <div className='app-container'>
        {!authToken && <Auth />}
        {authToken && (
          <>
            <ListHeader listName={'Your ToDo List'} getData={getData} />
            {sortedTasks?.map((task) => (
              <ListItem key={task.id} task={task} getData={getData} />
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default App;

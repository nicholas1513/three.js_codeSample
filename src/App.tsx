import ReactDOM from 'react-dom'
import React from 'react'
import Grid from '@material-ui/core/Grid'
import './App.css';
import TruckLoader from './truckLoader';

// import "./styles.css";

export default function App() {
  return (
    <>
      <Grid container>
        <TruckLoader width={800} height={800}></TruckLoader>
      </Grid>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

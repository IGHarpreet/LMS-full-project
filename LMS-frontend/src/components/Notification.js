import React, { Component } from 'react'
import firebase from './firebase'


export default class Notification extends Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }
  componentDidMount() {
    const messaging = firebase.messaging()
    messaging.requestPermission().then(() => {
      return messaging.getToken()
    }).then(token => {
      console.log("Token for notification ", token)
    }).catch(() => {
      console.log("error in accessing notification")
    })
  }
  render() {
    return (
      <div>Notification</div>
    )
  }
}

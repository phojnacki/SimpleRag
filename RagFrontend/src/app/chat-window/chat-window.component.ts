import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {

  messages: { text: string, timestamp: string, isSystemic: boolean }[] = [];

  constructor(private localStorageService: ChatService, private http: HttpClient) {}

  ngOnInit() {
    const storedMessages = this.localStorageService.getItem('chatMessages');
    if (storedMessages) {
      this.messages = JSON.parse(storedMessages);
    }

  }

  sendMessage(newMessage: string) {
    if (newMessage.trim() !== '') {
      const timestamp = this.getCurrentTime();
      this.messages.push({ text: newMessage, timestamp, isSystemic: false });
      this.localStorageService.setItem('chatMessages', JSON.stringify(this.messages));
      const url = `http://localhost:5000/ragAnswer`;
      const params = new URLSearchParams({ question: newMessage }).toString();
      
      fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain' // Set the appropriate headers
        }
      })
      .then(async response => {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to read response');
        }
        const decoder = new TextDecoder();

        var msg = { text: "", timestamp: timestamp, isSystemic: true };
        this.messages.push(msg);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          const jsonPart = decoder.decode(value);
          console.log(jsonPart);
          msg.text+=jsonPart;
        }
        reader.releaseLock();
      })
      .catch(error => {
        console.error('Error streaming data:', error);
      });


      // this.http.get(url, { params: { question: newMessage }, observe: 'body', responseType: 'text' })
      //   .subscribe({
      //     next: (response) => {
      //       this.messages.push({ text: response, timestamp, isSystemic : true });
      //       this.localStorageService.setItem('chatMessages', JSON.stringify(this.messages));
      //     },
      //     error: (error) => {
      //       console.error('Error:', error);
      //     }
      //   });
    }
  }

 

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
}

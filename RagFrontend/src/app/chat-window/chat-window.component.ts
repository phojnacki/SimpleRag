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
      this.http.get(url, { params: { question: newMessage }, observe: 'body', responseType: 'text' })
        .subscribe({
          next: (response) => {
            this.messages.push({ text: response, timestamp, isSystemic : true });
            this.localStorageService.setItem('chatMessages', JSON.stringify(this.messages));
          },
          error: (error) => {
            console.error('Error:', error);
          }
        });
    }
  }

 

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
}

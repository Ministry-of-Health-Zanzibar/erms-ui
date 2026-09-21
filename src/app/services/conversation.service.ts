import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // ✅ GET conversations
  getConversations(patientHistoryId: number) {
    return this.http.get(
      `${this.baseUrl}patient-history-conversations?patient_history_id=${patientHistoryId}`
    );
  }

  // ✅ SEND message / reply
  sendMessage(payload: any) {
    return this.http.post(
      `${this.baseUrl}patient-history-conversations`,
      payload
    );
  }

  // ✅ GET individual chat (DG ↔ Mkurugenzi)
  getIndividualChat(patientHistoryId: number) {
    return this.http.get(
      `${this.baseUrl}patient-history-conversations/${patientHistoryId}/individual-chat`
    );
  }

  getMkurugenziComments(id: number) {
    return this.http.get(
      `${this.baseUrl}patient-histories/${id}/mkurugenzi-comments`
    );
  }

  // conversation.service.ts

  // ✅ GET Unread Notifications for Header Badge
  getUnreadNotifications() {
    return this.http.get(`${this.baseUrl}patient-history-conversations/unread`);
  }

  // ✅ Mark conversation items read
  markAsRead(patientHistoryId: number) {
    return this.http.post(`${this.baseUrl}patient-history-conversations/mark-read`, {
      patient_history_id: patientHistoryId
    });
  }
}

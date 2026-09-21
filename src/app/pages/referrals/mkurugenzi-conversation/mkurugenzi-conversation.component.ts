import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConversationService } from '../../../services/conversation.service';

@Component({
  selector: 'app-mkurugenzi-conversation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './mkurugenzi-conversation.component.html',
  styleUrl: './mkurugenzi-conversation.component.scss'
})
export class MkurugenziConversationComponent implements OnInit {
  conversations: any[] = [];
  message: string = '';
  replyMessage: string = '';
  receiver: string = 'dg'; // Pre-set default target role
  activeReplyId: number | null = null;
  
  sendingMessage: boolean = false;
  sendingReply: boolean = false;

  patientInfo: any = {
    patient_name: 'Loading Context...',
    file_number: '...',
    diagnosis: '...'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private conversationService: ConversationService,
    private dialogRef: MatDialogRef<MkurugenziConversationComponent>
  ) {}

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.conversationService.getIndividualChat(this.data.patientHistoryId)
      .subscribe((res: any) => {
        if (!res.data) {
          this.conversations = [];
        } else if (Array.isArray(res.data)) {
          this.conversations = res.data;
        } else {
          this.conversations = [res.data];
        }

        if (this.conversations.length > 0) {
          const contextObj = this.conversations[0];
          this.patientInfo = {
            patient_name: contextObj.patient_name || `${contextObj.first_name || ''} ${contextObj.last_name || ''}`.trim() || 'Unknown Patient',
            file_number: contextObj.file_number || contextObj.registration_number || 'N/A',
            diagnosis: contextObj.diagnosis || contextObj.reason_for_referral || contextObj.message || 'Consultation Context'
          };
        } else {
          this.patientInfo = {
            patient_name: 'New Consultation Thread',
            file_number: 'N/A',
            diagnosis: 'No prior diagnostic history found.'
          };
        }

        this.conversationService.markAsRead(this.data.patientHistoryId).subscribe({
          error: (err) => console.error('Failed to clear unread status flags:', err)
        });
      });
  }

  openReplyBox(msg: any) {
    this.activeReplyId = msg.conversation_id;
    this.replyMessage = '';
  }

  cancelReply() {
    this.activeReplyId = null;
    this.replyMessage = '';
  }

  sendReply(msg: any) {
    if (!this.replyMessage.trim()) return;

    const payload = {
      patient_history_id: this.data.patientHistoryId,
      message: this.replyMessage,
      parent_id: msg.conversation_id,
      receiver: this.receiver
    };

    this.sendingReply = true;

    this.conversationService.sendMessage(payload)
      .subscribe({
        next: () => {
          this.replyMessage = '';
          this.activeReplyId = null;
          this.loadMessages();
        },
        error: (err) => console.error('Error dispatching inline reply thread:', err),
        complete: () => this.sendingReply = false
      });
  }

  sendMessage() {
    if (!this.message.trim()) return;

    const payload = {
      patient_history_id: this.data.patientHistoryId,
      message: this.message,
      receiver: this.receiver
    };

    this.sendingMessage = true;

    this.conversationService.sendMessage(payload)
      .subscribe({
        next: () => {
          this.message = '';
          this.loadMessages();
        },
        error: (err) => console.error('Error dispatching root message:', err),
        complete: () => this.sendingMessage = false
      });
  }

  canStartConversation(): boolean {
    return true; 
  }

  getReceivers(): string[] {
    return ['dg'];
  }

  isHospital(): boolean {
    return false;
  }
}
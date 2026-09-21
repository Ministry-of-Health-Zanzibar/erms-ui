import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConversationService } from '../../../services/conversation.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-conversation-modal',
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
  templateUrl: './conversation-modal.component.html',
  styleUrl: './conversation-modal.component.scss'
})
export class ConversationModalComponent implements OnInit {
  conversations: any[] = [];
  message: string = '';
  replyMessage: string = '';
  receiver: string = '';
  activeReplyId: number | null = null;
  role: string = '';

  sendingMessage: boolean = false;
  sendingReply: boolean = false;

  patientInfo: any = {
    patient_name: 'Loading Context...',
    file_number: '...',
    diagnosis: '...'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private conversationService: ConversationService,
    private dialogRef: MatDialogRef<ConversationModalComponent>,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.role = localStorage.getItem('roles') || '';
    this.loadMessages();
  }

  isDG(): boolean {
    return this.role === 'ROLE DIRECTOR GENERAL';
  }

  isMkurugenzi(): boolean {
    return this.role === 'ROLE MKURUGENZI TIBA';
  }

  isBoard(): boolean {
    return this.role === 'ROLE MEDICAL BOARD MEMBER';
  }

  isHospital(): boolean {
    return this.role === 'ROLE HOSPITAL USER';
  }

  openReplyBox(msg: any) {
    this.activeReplyId = msg.conversation_id;
    this.replyMessage = '';
  }

  cancelReply() {
    this.activeReplyId = null;
    this.replyMessage = '';
  }

  canStartConversation(): boolean {
    return !this.isHospital();
  }

  getReceivers(): string[] {
    if (this.isDG()) {
      return ['mkurugenzi', 'board', 'hospital'];
    }
    if (this.isMkurugenzi()) {
      return ['board', 'hospital'];
    }
    if (this.isBoard()) {
      return ['hospital'];
    }
    return [];
  }

  loadMessages() {
    this.conversationService
      .getConversations(this.data.patientHistoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        this.conversations = res.data || [];
        
        if (this.conversations.length > 0) {
          const contextObj = this.conversations[0];
          this.patientInfo = {
            patient_name: contextObj.patient_name || `${contextObj.first_name || ''} ${contextObj.last_name || ''}`.trim() || 'Unknown Patient',
            file_number: contextObj.file_number || contextObj.registration_number || 'N/A',
            diagnosis: contextObj.diagnosis || contextObj.reason_for_referral || 'General Consultation'
          };
        } else {
          this.patientInfo = {
            patient_name: 'New Consultation Thread',
            file_number: 'N/A',
            diagnosis: 'No prior diagnostic history found.'
          };
        }
        
        this.conversationService.markAsRead(this.data.patientHistoryId)
          .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      });
  }

  sendMessage() {
    if (!this.message.trim()) return;

    const payload: any = {
      patient_history_id: this.data.patientHistoryId,
      message: this.message,
      receiver: this.receiver
    };

    this.sendingMessage = true;

    this.conversationService.sendMessage(payload)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.sendingMessage = false))
      .subscribe({
        next: () => {
          this.message = '';
          this.receiver = '';
          this.loadMessages();
        },
        error: () => {}
      });
  }

  sendReply(msg: any) {
    if (!this.replyMessage.trim()) return;

    const payload = {
      patient_history_id: this.data.patientHistoryId,
      message: this.replyMessage,
      parent_id: msg.conversation_id
    };

    this.sendingReply = true;

    this.conversationService.sendMessage(payload)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.sendingReply = false))
      .subscribe({
        next: () => {
          this.replyMessage = '';
          this.activeReplyId = null;
          this.loadMessages();
        },
        error: () => {}
      });
  }
}

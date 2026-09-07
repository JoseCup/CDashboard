import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campaign-version',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-version.html',
  styleUrls: ['./campaign-version.css']
})
export class CampaignVersionComponent {

  @Input() versions: any[] = [];
  @Input() campaign: any;
  @Input() isPlatformDesigner = false;
  @Input() isPlatformAdmin = false;

  @Output() uploadVersion = new EventEmitter<FormData>();
  @Output() updateDropbox = new EventEmitter<string>();

  selectedFile!: File;
  notes = '';
  dropboxUrl = '';

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {

    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('notes', this.notes);

    this.uploadVersion.emit(formData);

    this.notes = '';

  }

  saveDropboxLink() {
    this.updateDropbox.emit(this.dropboxUrl);
  }

  getPreviewUrl(v: any) {
    return 'http://localhost:5000' + v.preview_url;
  }

  getNoteSnippet(notes: string) {
    if (!notes) return '';
    return notes.length > 100 ? notes.substring(0, 100) + '...' : notes;
  }

  downloadFile(url: string) {
    window.open('http://localhost:5000' + url, '_blank');
  }

}
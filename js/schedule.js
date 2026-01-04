// Schedule Management Functions

// Handle XML Upload
async function handleXMLUpload(input) {
    if (!input.files[0]) return;
    
    const file = input.files[0];
    const progressBar = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const processBtn = document.getElementById('process-btn');
    
    // Show progress
    document.getElementById('upload-progress').style.display = 'flex';
    progressBar.style.width = '25%';
    progressText.textContent = '25% - جاري قراءة الملف...';
    
    try {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            progressBar.style.width = '50%';
            progressText.textContent = '50% - جاري تحليل البيانات...';
            
            const xmlText = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            progressBar.style.width = '75%';
            progressText.textContent = '75% - جاري تخزين البيانات...';
            
            // Parse XML data
            await parseScheduleXML(xmlDoc);
            
            progressBar.style.width = '100%';
            progressText.textContent = '100% - تم التحميل بنجاح!';
            
            // Enable process button
            processBtn.disabled = false;
            
            showNotification('تم تحميل الجدول بنجاح', 'success');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeUploadModal();
                document.getElementById('upload-progress').style.display = 'none';
                progressBar.style.width = '0%';
                processBtn.disabled = true;
            }, 2000);
        };
        
        reader.onerror = function() {
            showNotification('خطأ في قراءة الملف', 'error');
            document.getElementById('upload-progress').style.display = 'none';
        };
        
        reader.readAsText(file, "windows-1256");
        
    } catch (error) {
        console.error('XML upload error:', error);
        showNotification('خطأ في معالجة الملف', 'error');
        document.getElementById('upload-progress').style.display = 'none';
    }
}

// Parse Schedule XML
async function parseScheduleXML(xmlDoc) {
    try {
        // Clear existing data
        appState.data.teachers = {};
        appState.data.classes = {};
        appState.data.subjects = {};
        appState.data.periods = [];
        appState.data.lessons = [];
        
        // Parse teachers
        const teacherElements = xmlDoc.getElementsByTagName('teacher');
        Array.from(teacherElements).forEach(teacher => {
            const id = teacher.getAttribute('id');
            const name = teacher.getAttribute('name');
            if (id && name) {
                appState.data.teachers[id] = name;
            }
        });
        
        // Parse classes
        const classElements = xmlDoc.getElementsByTagName('class');
        Array.from(classElements).forEach(cls => {
            const id = cls.getAttribute('id');
            const name = cls.getAttribute('short');
            if (id && name) {
                appState.data.classes[id] = name;
            }
        });
        
        // Parse subjects
        const subjectElements = xmlDoc.getElementsByTagName('subject');
        Array.from(subjectElements).forEach(subject => {
            const id = subject.getAttribute('id');
            const name = subject.getAttribute('name');
            if (id && name) {
                appState.data.subjects[id] = name;
            }
        });
        
        // Parse periods
        const periodElements = xmlDoc.getElementsByTagName('period');
        Array.from(periodElements).forEach(period => {
            const id = period.getAttribute('period');
            const start = period.getAttribute('starttime');
            const end = period.getAttribute('endtime');
            if (id && start && end) {
                appState.data.periods.push({
                    id: id,
                    s: start,
                    e: end
                });
            }
        });
        
        // Parse lessons
        const lessonElements = xmlDoc.getElementsByTagName('TimeTableSchedule');
        Array.from(lessonElements).forEach(lesson => {
            appState.data.lessons.push({
                d: lesson.getAttribute('DayID'),
                p: lesson.getAttribute('Period'),
                c: lesson.getAttribute('ClassID'),
                t: lesson.getAttribute('TeacherID'),
                s: lesson.getAttribute('SubjectGradeID')
            });
        });
        
        // Sort periods by ID
        appState.data.periods.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        // Save to Firebase if logged in
        if (appState.user && !localStorage.getItem('demoMode')) {
            await saveDataToFirebase();
        } else {
            // Save to localStorage
            localStorage.setItem('schoolData', JSON.stringify(appState.data));
        }
        
        // Update UI
        updateUI();
        updateScheduleTable();
        
        return true;
        
    } catch (error) {
        console.error('XML parsing error:', error);
        throw error;
    }
}

// Process XML Upload
async function processXMLUpload() {
    const input = document.getElementById('xml-file-input');
    if (!input.files[0]) {
        showNotification('لم تختر ملفاً', 'warning');
        return;
    }
    
    await handleXMLUpload(input);
}

// Update Schedule Table
function updateScheduleTable() {
    const container = document.getElementById('schedule-table-container');
    
    if (appState.data.lessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>لا يوجد جدول مدرسي</h3>
                <p>ابدأ برفع ملف الجدول (XML) لمشاهدة الجدول</p>
                <button class="btn btn-primary" onclick="openUploadModal()">
                    <i class="fas fa-upload"></i> رفع جدول الآن
                </button>
            </div>
        `;
        return;
    }
    
    // Group lessons by day and period
    const schedule = {};
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    days.forEach((dayName, dayIndex) => {
        schedule[dayIndex + 1] = {};
        appState.data.periods.forEach(period => {
            schedule[dayIndex + 1][period.id] = [];
        });
    });
    
    // Populate schedule
    appState.data.lessons.forEach(lesson => {
        if (schedule[lesson.d] && schedule[lesson.d][lesson.p]) {
            schedule[lesson.d][lesson.p].push(lesson);
        }
    });
    
    // Create table HTML
    let html = `
        <div class="schedule-table">
            <table>
                <thead>
                    <tr>
                        <th>الحصة</th>
                        ${days.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    appState.data.periods.forEach(period => {
        html += `<tr><td>${period.id}<br><small>${period.s}-${period.e}</small></td>`;
        
        days.forEach((day, dayIndex) => {
            const dayNum = dayIndex + 1;
            const lessons = schedule[dayNum][period.id] || [];
            
            html += '<td>';
            
            if (lessons.length > 0) {
                lessons.forEach(lesson => {
                    const teacher = appState.data.teachers[lesson.t] || 'غير معروف';
                    const className = appState.data.classes[lesson.c] || 'غير معروف';
                    const subject = appState.data.subjects[lesson.s] || 'غير معروف';
                    
                    html += `
                        <div class="schedule-item">
                            <strong>${className}</strong><br>
                            <small>${teacher}</small><br>
                            <span class="subject">${subject}</span>
                        </div>
                    `;
                });
            } else {
                html += '<span class="text-muted">---</span>';
            }
            
            html += '</td>';
        });
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Filter by Day
function filterByDay() {
    const dayFilter = document.getElementById('day-filter').value;
    
    if (dayFilter === 'all') {
        updateScheduleTable();
        return;
    }
    
    const container = document.getElementById('schedule-table-container');
    const dayNum = parseInt(dayFilter);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const dayName = days[dayNum - 1];
    
    if (appState.data.lessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>لا يوجد جدول مدرسي</h3>
                <p>ابدأ برفع ملف الجدول (XML) لمشاهدة الجدول</p>
                <button class="btn btn-primary" onclick="openUploadModal()">
                    <i class="fas fa-upload"></i> رفع جدول الآن
                </button>
            </div>
        `;
        return;
    }
    
    // Get lessons for selected day
    const dayLessons = appState.data.lessons.filter(lesson => lesson.d === dayFilter.toString());
    
    if (dayLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>لا توجد حصص في ${dayName}</h3>
                <p>لا توجد حصص مدرسية في هذا اليوم</p>
                <button class="btn btn-secondary" onclick="document.getElementById('day-filter').value='all'; filterByDay();">
                    عرض كل الأيام
                </button>
            </div>
        `;
        return;
    }
    
    // Group by period
    const scheduleByPeriod = {};
    appState.data.periods.forEach(period => {
        scheduleByPeriod[period.id] = [];
    });
    
    dayLessons.forEach(lesson => {
        if (scheduleByPeriod[lesson.p]) {
            scheduleByPeriod[lesson.p].push(lesson);
        }
    });
    
    // Create table HTML
    let html = `
        <div class="day-schedule">
            <h4>جدول ${dayName}</h4>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>الحصة</th>
                            <th>الوقت</th>
                            <th>الصف</th>
                            <th>المعلم</th>
                            <th>المادة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    appState.data.periods.forEach(period => {
        const lessons = scheduleByPeriod[period.id] || [];
        
        if (lessons.length > 0) {
            lessons.forEach(lesson => {
                const teacher = appState.data.teachers[lesson.t] || 'غير معروف';
                const className = appState.data.classes[lesson.c] || 'غير معروف';
                const subject = appState.data.subjects[lesson.s] || 'غير معروف';
                const phone = appState.phones[teacher];
                
                html += `
                    <tr>
                        <td>${period.id}</td>
                        <td>${period.s} - ${period.e}</td>
                        <td>${className}</td>
                        <td>${teacher}</td>
                        <td>${subject}</td>
                        <td>
                            ${phone ? `
                                <button class="btn btn-sm btn-success" onclick="sendWhatsAppMessage('${teacher}', '${className}', '${period.id}', '${period.s}', '${period.e}', '${subject}')">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-info" onclick="viewTeacherDetails('${lesson.t}')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-secondary" onclick="document.getElementById('day-filter').value='all'; filterByDay();">
                    <i class="fas fa-arrow-right"></i> عرض كل الجدول
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Export Schedule
function exportSchedule() {
    if (appState.data.lessons.length === 0) {
        showNotification('لا توجد بيانات للتصدير', 'warning');
        return;
    }
    
    try {
        // Create CSV content
        let csv = "اليوم,الحصة,الصف,المعلم,المادة,الهاتف\n";
        
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        
        appState.data.lessons.forEach(lesson => {
            const dayName = days[parseInt(lesson.d) - 1] || lesson.d;
            const period = appState.data.periods.find(p => p.id === lesson.p);
            const periodTime = period ? `${period.s}-${period.e}` : lesson.p;
            const teacher = appState.data.teachers[lesson.t] || 'غير معروف';
            const className = appState.data.classes[lesson.c] || 'غير معروف';
            const subject = appState.data.subjects[lesson.s] || 'غير معروف';
            const phone = appState.phones[teacher] || '';
            
            csv += `"${dayName}","${periodTime}","${className}","${teacher}","${subject}","${phone}"\n`;
        });
        
        // Create and download file
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `جدول_مدرسي_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('تم تصدير الجدول بنجاح', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('خطأ في تصدير الجدول', 'error');
    }
}

// Clear Schedule
function clearSchedule() {
    if (confirm('هل أنت متأكد من مسح الجدول المدرسي؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        appState.data.lessons = [];
        appState.data.periods = [];
        
        if (appState.user && !localStorage.getItem('demoMode')) {
            saveDataToFirebase();
        } else {
            localStorage.setItem('schoolData', JSON.stringify(appState.data));
        }
        
        updateUI();
        updateScheduleTable();
        
        showNotification('تم مسح الجدول', 'success');
    }
}

// Send WhatsApp Message
function sendWhatsAppMessage(teacher, className, periodId, startTime, endTime, subject) {
    const phone = appState.phones[teacher];
    
    if (!phone) {
        showNotification('لا يوجد رقم هاتف للمعلم', 'warning');
        return;
    }
    
    const message = `الأستاذ/ ${teacher}
نذكركم بحصتكم:
الحصة: ${periodId}
الصف: ${className}
المادة: ${subject}
الوقت: ${startTime} - ${endTime}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// View Teacher Details
function viewTeacherDetails(teacherId) {
    const teacherName = appState.data.teachers[teacherId];
    
    if (!teacherName) {
        showNotification('المعلم غير موجود', 'error');
        return;
    }
    
    const phone = appState.phones[teacherName] || 'غير مسجل';
    
    // Show teacher details in a modal or alert
    alert(`
        معلومات المعلم:
        
        الاسم: ${teacherName}
        رقم الهاتف: ${phone}
        
        يمكنك تعديل رقم الهاتف من إعدادات المعلمين.
    `);
}

// Export functions to global scope
window.handleXMLUpload = handleXMLUpload;
window.processXMLUpload = processXMLUpload;
window.filterByDay = filterByDay;
window.exportSchedule = exportSchedule;
window.clearSchedule = clearSchedule;
window.sendWhatsAppMessage = sendWhatsAppMessage;
window.viewTeacherDetails = viewTeacherDetails;
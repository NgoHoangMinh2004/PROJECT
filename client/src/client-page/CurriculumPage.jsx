import React from 'react';
import { Card, Typography, Collapse } from 'antd';
import { ReadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const CurriculumPage = () => {
    const items = [
        {
            key: '1',
            label: 'Bài 1: Làm quen & Chào hỏi',
            children: (
                <div>
                    <Title level={5}>1. Từ vựng (Vocabulary)</Title>
                    <ul>
                        <li><Text strong>Hello / Hi:</Text> Xin chào</li>
                        <li><Text strong>Goodbye / Bye:</Text> Tạm biệt</li>
                        <li><Text strong>Thank you:</Text> Cảm ơn</li>
                    </ul>
                    <Title level={5}>2. Ngữ pháp (Grammar)</Title>
                    <Paragraph>
                        Cấu trúc giới thiệu tên:<br />
                        - <Text code>My name is [Tên]</Text> (Tên tôi là...)<br />
                        - <Text code>I am [Tên]</Text> (Tôi là...)
                    </Paragraph>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Bài 2: Động từ To Be',
            children: <p>Nội dung đang cập nhật...</p>,
        },
    ];

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={2} style={{ color: '#58cc02', textAlign: 'center', marginBottom: 30 }}>
                <ReadOutlined /> Giáo Trình Tổng Hợp
            </Title>
            <Card style={{ borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Collapse items={items} defaultActiveKey={['1']} ghost size="large" />
            </Card>
        </div>
    );
};

export default CurriculumPage;